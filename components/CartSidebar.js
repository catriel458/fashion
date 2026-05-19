'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';

const DEFAULT_WA_TEMPLATE = 'Hola! Quiero realizar el pedido #{{order_id}}\n\nProductos:\n{{productos}}\n\nTotal: ${{total}}\n\nMis datos:\nNombre: {{nombre_cliente}}\nEmail: {{email_cliente}}\nPunto de retiro: {{punto_retiro}}';

function buildWhatsAppMessage(template, { order_id, items, total, nombre_cliente, email_cliente, punto_retiro }) {
  const tpl = template || DEFAULT_WA_TEMPLATE;
  const productosStr = (items || [])
    .map(i => `${i.quantity}x ${i.name} - $${parseFloat(i.price || i.price_at_purchase).toFixed(2)}`)
    .join('\n');
  return tpl
    .replace(/\{\{order_id\}\}/g, order_id)
    .replace(/\{\{productos\}\}/g, productosStr)
    .replace(/\{\{total\}\}/g, parseFloat(total).toFixed(2))
    .replace(/\{\{nombre_cliente\}\}/g, nombre_cliente || 'Cliente')
    .replace(/\{\{email_cliente\}\}/g, email_cliente || '')
    .replace(/\{\{punto_retiro\}\}/g, punto_retiro || 'No especificado');
}

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, sessionId, clearCartItems } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderConfirmedData, setOrderConfirmedData] = useState(null);
  const [checkoutError, setCheckoutError]     = useState('');
  const [couponCode, setCouponCode]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pickupPoints,  setPickupPoints]  = useState([]);
  const [selectedPoint, setSelectedPoint] = useState('');

  const storeSlugMatch = pathname?.match(/\/store\/([^/]+)/);
  const storeSlug = storeSlugMatch?.[1] || null;

  // Cargar puntos de retiro cuando cambia la tienda
  useEffect(() => {
    if (!storeSlug) { setPickupPoints([]); setSelectedPoint(''); return; }
    fetch(`/api/stores/${storeSlug}/pickup-points`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPickupPoints(d); })
      .catch(() => {});
  }, [storeSlug]);

  const discountedTotal = appliedCoupon
    ? total * (1 - appliedCoupon.discount_percentage / 100)
    : total;

  async function handleApplyCoupon(e) {
    e.preventDefault();
    if (!couponCode.trim() || !storeSlug) return;
    setCouponLoading(true); setCouponError('');
    try {
      const res = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), storeSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppliedCoupon(data);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  }

  async function doCheckout() {
    if (!sessionId) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:      sessionId,
          coupon_id:       appliedCoupon?.coupon_id || null,
          pickup_point_id: selectedPoint ? parseInt(selectedPoint) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la compra');

      clearCartItems();

      // Abrir WhatsApp si la tienda tiene número configurado
      if (data.store?.whatsapp_number) {
        const nombre = session?.user?.first_name && session?.user?.last_name
          ? `${session.user.first_name} ${session.user.last_name}`
          : session?.user?.username || 'Cliente';

        const selectedPointData = pickupPoints.find(p => String(p.id) === selectedPoint);
        const message = buildWhatsAppMessage(data.store.whatsapp_message_template, {
          order_id:       data.id,
          items:          data.items || items,
          total:          data.total,
          nombre_cliente: nombre,
          email_cliente:  session?.user?.email || '',
          punto_retiro:   selectedPointData?.name || data.pickup_point_name || '',
        });

        const waUrl = `https://wa.me/${data.store.whatsapp_number}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }

      setOrderConfirmedData(data);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    if (orderConfirmedData) setTimeout(() => setOrderConfirmedData(null), 400);
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)', zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh',
        width: isOpen ? '380px' : '0', maxWidth: '100vw',
        background: 'var(--store-panel-bg, #fafaf8)', zIndex: 1000,
        transition: 'width 0.3s ease', overflow: 'hidden',
        borderLeft: '0.5px solid rgba(128,128,128,0.2)',
        color: 'var(--store-panel-text, #0f0f0f)',
      }}>
        <div style={{
          width: '380px', maxWidth: '100vw', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '24px', boxSizing: 'border-box',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', paddingBottom: '16px',
            borderBottom: '0.5px solid rgba(128,128,128,0.2)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.5rem', margin: 0, letterSpacing: '0.04em', color: 'var(--store-panel-text, #0f0f0f)' }}>
              {orderConfirmedData ? 'Pedido enviado' : 'Carrito'}
            </h2>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--store-panel-text, #6b6560)', padding: '4px', lineHeight: 1, opacity: 0.6 }}>
              ✕
            </button>
          </div>

          {/* Pantalla de confirmación post-compra */}
          {orderConfirmedData ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#2e7d32' }}>✓</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.3rem', margin: '0 0 6px' }}>
                  ¡Pedido #{orderConfirmedData.id} creado!
                </h3>
                {orderConfirmedData.store?.whatsapp_number ? (
                  <p style={{ color: '#6b6560', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 4px' }}>
                    Te redirigimos a WhatsApp para coordinar con <strong>{orderConfirmedData.store.name}</strong>
                  </p>
                ) : (
                  <p style={{ color: '#6b6560', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 4px' }}>
                    El local se pondrá en contacto contigo a la brevedad
                  </p>
                )}
                <p style={{ color: '#6b6560', fontSize: '0.78rem', margin: 0 }}>
                  Total: <strong>${parseFloat(orderConfirmedData.total).toFixed(2)}</strong>
                </p>
              </div>

              {/* Botón WhatsApp */}
              {orderConfirmedData.store?.whatsapp_number && (
                <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '6px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', margin: '0 0 8px' }}>
                    Si no se abrió WhatsApp automáticamente:
                  </p>
                  <a
                    href={`https://wa.me/${orderConfirmedData.store.whatsapp_number}?text=${encodeURIComponent(buildWhatsAppMessage(orderConfirmedData.store.whatsapp_message_template, {
                      order_id:       orderConfirmedData.id,
                      items:          orderConfirmedData.items || [],
                      total:          orderConfirmedData.total,
                      nombre_cliente: session?.user?.first_name && session?.user?.last_name
                        ? `${session.user.first_name} ${session.user.last_name}`
                        : session?.user?.username || 'Cliente',
                      email_cliente:  session?.user?.email || '',
                      punto_retiro:   orderConfirmedData.pickup_point_name || '',
                    }))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', width: '100%', background: '#25d366', color: '#fff',
                      padding: '11px', borderRadius: '4px', textDecoration: 'none',
                      fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      textAlign: 'center', boxSizing: 'border-box',
                    }}
                  >
                    Abrir WhatsApp
                  </a>
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '6px 0 0', textAlign: 'center' }}>
                    {orderConfirmedData.store.whatsapp_number}
                  </p>
                </div>
              )}

              {/* Punto de retiro seleccionado */}
              {orderConfirmedData.pickup_point_name && (
                <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '6px', padding: '12px 14px' }}>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534' }}>Punto de retiro</span>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, margin: '3px 0 0' }}>{orderConfirmedData.pickup_point_name}</p>
                </div>
              )}

              {/* Datos de retiro */}
              {(orderConfirmedData.store?.address || orderConfirmedData.store?.pickup_info) && (
                <div style={{ background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '12px 14px' }}>
                  {orderConfirmedData.store.address && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560' }}>Dirección</span>
                      <p style={{ fontSize: '0.8rem', margin: '2px 0 0', color: '#0f0f0f' }}>{orderConfirmedData.store.address}</p>
                    </div>
                  )}
                  {orderConfirmedData.store.pickup_info && (
                    <div>
                      <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560' }}>Retiro</span>
                      <p style={{ fontSize: '0.8rem', margin: '2px 0 0', color: '#0f0f0f' }}>{orderConfirmedData.store.pickup_info}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
                <Link
                  href="/profile/orders"
                  onClick={handleClose}
                  style={{
                    display: 'block', width: '100%', background: '#0f0f0f', color: '#fafaf8',
                    padding: '13px', borderRadius: '2px', textDecoration: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                    letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  Ver mis pedidos →
                </Link>
                <button
                  onClick={handleClose}
                  style={{
                    width: '100%', background: 'none', color: '#6b6560',
                    border: '0.5px solid #e0dbd4', padding: '11px', borderRadius: '2px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                  }}
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {checkoutError && (
                  <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 14px', borderRadius: '4px', marginBottom: '12px', color: '#c0392b', fontSize: '0.8rem' }}>
                    {checkoutError}
                  </div>
                )}

                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🛍️</div>
                    Tu carrito está vacío
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '16px 0', borderBottom: '0.5px solid #e0dbd4' }}>
                      <div style={{ width: '72px', height: '88px', background: '#f0ede8', borderRadius: '4px', flexShrink: 0, overflow: 'hidden' }}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👕</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--store-panel-text, #0f0f0f)' }}>
                          {item.name}
                        </p>
                        <p style={{ margin: '0 0 12px', color: 'var(--store-panel-text, #6b6560)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', opacity: 0.7 }}>
                          ${parseFloat(item.price).toFixed(2)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            style={{ width: '26px', height: '26px', border: '0.5px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--store-panel-text, #0f0f0f)' }}>
                            −
                          </button>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', minWidth: '20px', textAlign: 'center', color: 'var(--store-panel-text, #0f0f0f)' }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            style={{ width: '26px', height: '26px', border: '0.5px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--store-panel-text, #0f0f0f)' }}>
                            +
                          </button>
                          <button onClick={() => removeItem(item.product_id)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '0.75rem', fontFamily: 'var(--font-sans)' }}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div style={{ paddingTop: '16px', borderTop: '0.5px solid rgba(128,128,128,0.2)' }}>

                  {session && storeSlug && !appliedCoupon && (
                    <form onSubmit={handleApplyCoupon} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>
                        ¿Tenés un cupón?
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          value={couponCode} onChange={e => setCouponCode(e.target.value)}
                          placeholder="Código de cupón"
                          style={{ flex: 1, padding: '7px 10px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontSize: '0.78rem', outline: 'none', borderRadius: '2px', fontFamily: 'monospace', letterSpacing: '0.08em' }}
                        />
                        <button type="submit" disabled={couponLoading || !couponCode.trim()} style={{ padding: '7px 12px', background: '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.65rem', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                          {couponLoading ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && <p style={{ fontSize: '0.65rem', color: '#c0392b', margin: '4px 0 0' }}>{couponError}</p>}
                    </form>
                  )}

                  {appliedCoupon && (
                    <div style={{ marginBottom: '12px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: '#166534' }}>✓ Cupón aplicado: -{appliedCoupon.discount_percentage}%</span>
                      <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '0.7rem', padding: 0 }}>✕</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: appliedCoupon ? '4px' : '16px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--store-panel-text, #6b6560)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
                      Total
                    </span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--store-panel-text, #0f0f0f)', textDecoration: appliedCoupon ? 'line-through' : 'none', opacity: appliedCoupon ? 0.5 : 1 }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#166534', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Con descuento
                      </span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: '#166534' }}>
                        ${discountedTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Selector de punto de retiro */}
                  {pickupPoints.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>
                        Punto de retiro
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pickupPoints.map(p => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '9px 11px', border: `0.5px solid ${selectedPoint === String(p.id) ? '#0f0f0f' : '#e0dbd4'}`, borderRadius: '3px', background: selectedPoint === String(p.id) ? '#f5f3f0' : '#fafaf8' }}>
                            <input
                              type="radio"
                              name="pickup_point"
                              value={String(p.id)}
                              checked={selectedPoint === String(p.id)}
                              onChange={e => setSelectedPoint(e.target.value)}
                              style={{ marginTop: '2px', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--store-panel-text, #0f0f0f)' }}>{p.name}</div>
                              {p.address && <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '1px' }}>{p.address}</div>}
                              {p.description && <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '1px' }}>{p.description}</div>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {session ? (
                    <button
                      onClick={doCheckout}
                      disabled={checkoutLoading}
                      style={{
                        width: '100%', background: checkoutLoading ? '#888' : '#0f0f0f', color: '#fafaf8',
                        border: 'none', padding: '14px', borderRadius: '2px',
                        fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {checkoutLoading ? 'Procesando...' : 'Finalizar compra'}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: '0 0 12px', lineHeight: 1.5 }}>
                        Para finalizar tu compra necesitás iniciar sesión
                      </p>
                      <Link
                        href={`/login?callbackUrl=${typeof window !== 'undefined' ? window.location.pathname : '/'}`}
                        onClick={handleClose}
                        style={{
                          display: 'block', width: '100%', background: '#0f0f0f', color: '#fafaf8',
                          padding: '14px', borderRadius: '2px', textDecoration: 'none',
                          fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                          letterSpacing: '0.16em', textTransform: 'uppercase',
                          textAlign: 'center', boxSizing: 'border-box',
                        }}
                      >
                        Ingresar para comprar
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
