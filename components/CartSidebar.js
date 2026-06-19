'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from './CartContext';

const MapWithRadius = dynamic(() => import('./MapWithRadius'), { ssr: false });

const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.55)',
  zIndex: 1100,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '16px',
};

const modalBox = {
  background: '#fafaf8',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '460px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  position: 'relative',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        marginLeft: '8px', padding: '2px 8px',
        background: copied ? '#e8f5e9' : '#f0ede8',
        border: `0.5px solid ${copied ? '#a5d6a7' : '#e0dbd4'}`,
        borderRadius: '3px', cursor: 'pointer',
        fontSize: '0.6rem', letterSpacing: '0.08em',
        color: copied ? '#2e7d32' : '#6b6560',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

export default function CartSidebar({ storeSlug: propSlug }) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, sessionId, clearCartItems } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();

  const [checkoutLoading,    setCheckoutLoading]    = useState(false);
  const [orderConfirmedData, setOrderConfirmedData] = useState(null);
  const [checkoutError,      setCheckoutError]      = useState('');
  const [couponCode,         setCouponCode]         = useState('');
  const [couponLoading,      setCouponLoading]      = useState(false);
  const [couponError,        setCouponError]        = useState('');
  const [appliedCoupon,      setAppliedCoupon]      = useState(null);
  const [pickupPoints,       setPickupPoints]       = useState([]);
  const [selectedPoint,      setSelectedPoint]      = useState('');
  const [paymentSettings,    setPaymentSettings]    = useState(null);

  // Delivery
  const [deliverySettings,   setDeliverySettings]   = useState(null);
  const [deliveryMethod,     setDeliveryMethod]     = useState('pickup');
  const [deliveryAddress,    setDeliveryAddress]    = useState('');
  const [deliveryLat,        setDeliveryLat]        = useState(null);
  const [deliveryLng,        setDeliveryLng]        = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddrSugg,       setShowAddrSugg]       = useState(false);
  const [deliveryAvail,      setDeliveryAvail]      = useState(null);
  const [checkingDelivery,   setCheckingDelivery]   = useState(false);
  const [savedAddress,       setSavedAddress]       = useState(null);
  const [saveAddrToProfile,  setSaveAddrToProfile]  = useState(false);
  const [usingCustomAddr,    setUsingCustomAddr]    = useState(false);

  // Payment modals
  const [showPaymentModal,   setShowPaymentModal]   = useState(false);
  const [showTransferModal,  setShowTransferModal]  = useState(false);

  // Post-confirmation comprobante upload (P3)
  const [compFile,           setCompFile]           = useState(null);
  const [uploadingComp,      setUploadingComp]      = useState(false);
  const [uploadCompDone,     setUploadCompDone]     = useState(false);
  const [uploadCompError,    setUploadCompError]    = useState('');
  const postCompRef = useRef(null);

  const addrDebounceRef = useRef(null);
  const pathSlug = pathname?.match(/\/store\/([^/]+)/)?.[1] || null;
  const storeSlug = propSlug || pathSlug;

  // Escape key
  useEffect(() => {
    function onEsc(e) {
      if (e.key !== 'Escape') return;
      if (showTransferModal)  { setShowTransferModal(false); return; }
      if (showPaymentModal)   { setShowPaymentModal(false);  return; }
      setIsOpen(false);
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [showTransferModal, showPaymentModal, setIsOpen]);

  // Load store data
  useEffect(() => {
    if (!storeSlug) {
      setPickupPoints([]); setSelectedPoint(''); setPaymentSettings(null); setDeliverySettings(null);
      return;
    }
    fetch(`/api/stores/${storeSlug}/pickup-points`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setPickupPoints(d); }).catch(() => {});
    fetch(`/api/stores/${storeSlug}/payment-settings`)
      .then(r => r.json()).then(d => setPaymentSettings(d)).catch(() => {});
    fetch(`/api/stores/${storeSlug}/delivery-settings`)
      .then(r => r.json()).then(d => setDeliverySettings(d)).catch(() => {});
  }, [storeSlug]);

  // Auto-check coverage when switching to delivery with saved address
  useEffect(() => {
    if (deliveryMethod !== 'delivery') return;
    if (!savedAddress?.lat || !savedAddress?.lng || !storeSlug) return;
    if (deliveryAvail) return;
    setCheckingDelivery(true);
    fetch(`/api/delivery/check?storeSlug=${storeSlug}&lat=${savedAddress.lat}&lng=${savedAddress.lng}`)
      .then(r => r.json())
      .then(d => setDeliveryAvail(d))
      .catch(() => setDeliveryAvail({ available: false, message: 'Error al verificar' }))
      .finally(() => setCheckingDelivery(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryMethod]);

  // Load saved address
  useEffect(() => {
    if (!session) return;
    fetch('/api/profile/address')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setSavedAddress(d); })
      .catch(() => {});
  }, [session]);

  // Totals
  const discountedTotal = appliedCoupon
    ? total * (1 - appliedCoupon.discount_percentage / 100)
    : total;

  const deliveryCost = (deliveryMethod === 'delivery' && deliveryAvail?.available)
    ? (deliveryAvail.cost || 0)
    : 0;

  const finalTotal = discountedTotal + deliveryCost;

  // Address autocomplete
  function handleAddressChange(value) {
    setDeliveryAddress(value);
    setDeliveryLat(null); setDeliveryLng(null);
    setDeliveryAvail(null);
    clearTimeout(addrDebounceRef.current);
    if (value.length < 3) { setAddressSuggestions([]); return; }
    addrDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setAddressSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        setShowAddrSugg(true);
      } catch { setAddressSuggestions([]); }
    }, 500);
  }

  async function handleSelectAddress(s) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setDeliveryAddress(s.display_name);
    setDeliveryLat(lat); setDeliveryLng(lng);
    setAddressSuggestions([]); setShowAddrSugg(false);
    if (storeSlug) {
      setCheckingDelivery(true);
      try {
        const res = await fetch(`/api/delivery/check?storeSlug=${storeSlug}&lat=${lat}&lng=${lng}`);
        const data = await res.json();
        setDeliveryAvail(data);
      } catch { setDeliveryAvail({ available: false, message: 'Error al verificar disponibilidad' }); }
      finally { setCheckingDelivery(false); }
    }
  }

  // Coupon
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
      setAppliedCoupon(data); setCouponCode('');
    } catch (err) { setCouponError(err.message); }
    finally { setCouponLoading(false); }
  }

  // Create order
  async function createOrder(method, extraFields = {}) {
    const effectiveAddress = usingCustomAddr ? deliveryAddress : (savedAddress?.full_address || deliveryAddress);
    const effectiveLat     = usingCustomAddr ? deliveryLat     : (savedAddress?.lat !== undefined ? savedAddress.lat : deliveryLat);
    const effectiveLng     = usingCustomAddr ? deliveryLng     : (savedAddress?.lng !== undefined ? savedAddress.lng : deliveryLng);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:       sessionId,
        coupon_id:        appliedCoupon?.coupon_id || null,
        pickup_point_id:  deliveryMethod === 'pickup' && selectedPoint ? parseInt(selectedPoint) : null,
        payment_method:   method,
        delivery_method:  deliveryMethod,
        delivery_address: deliveryMethod === 'delivery' ? effectiveAddress : null,
        delivery_lat:     deliveryMethod === 'delivery' ? effectiveLat     : null,
        delivery_lng:     deliveryMethod === 'delivery' ? effectiveLng     : null,
        delivery_cost:    deliveryCost,
        save_address:     deliveryMethod === 'delivery' && saveAddrToProfile,
        ...extraFields,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar la compra');
    return data;
  }

  // Validate before opening payment modal
  function handlePagarClick() {
    setCheckoutError('');
    if (!session) return;
    if (deliveryMethod === 'pickup' && pickupPoints.length > 0 && !selectedPoint) {
      setCheckoutError('Seleccioná un punto de retiro para continuar');
      return;
    }
    if (deliveryMethod === 'delivery') {
      const addr = usingCustomAddr ? deliveryAddress : (savedAddress?.full_address || deliveryAddress);
      if (!addr) { setCheckoutError('Ingresá tu dirección de envío para continuar'); return; }
      if (deliveryAvail && !deliveryAvail.available) {
        setCheckoutError('Tu dirección está fuera de la zona de cobertura');
        return;
      }
    }
    setShowPaymentModal(true);
  }

  // Mercado Pago flow
  async function handlePayWithMP() {
    setCheckoutLoading(true); setCheckoutError('');
    try {
      const order = await createOrder('mp');
      clearCartItems();
      const mpRes = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:      order.id,
          storeId:      order.store_id,
          cartItems:    (order.items || items).map(i => ({
            title:      i.name,
            quantity:   i.quantity,
            unit_price: parseFloat(i.price || i.price_at_purchase),
          })),
          customerData: { email: session?.user?.email || '' },
          successUrl:   `${window.location.origin}/profile/orders?payment=success`,
          failureUrl:   `${window.location.origin}${window.location.pathname}?payment=failure`,
          pendingUrl:   `${window.location.origin}/profile/orders?payment=pending`,
        }),
      });
      const mpData = await mpRes.json();
      if (!mpRes.ok) throw new Error(mpData.error || 'Error al iniciar Mercado Pago');
      window.location.href = mpData.checkoutUrl;
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutLoading(false);
    }
  }

  // Confirm transfer (no comprobante upload here — happens on confirmation screen)
  async function handleConfirmTransfer() {
    setCheckoutLoading(true); setCheckoutError('');
    try {
      const order = await createOrder('transfer');
      clearCartItems();
      setShowTransferModal(false);
      setShowPaymentModal(false);
      setOrderConfirmedData({ ...order, payment_method: 'transfer' });
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Upload comprobante after order confirmation (P3)
  async function handleUploadComp(orderId) {
    if (!compFile) return;
    setUploadingComp(true); setUploadCompError('');
    try {
      const fd = new FormData();
      fd.append('file', compFile);
      const res = await fetch(`/api/orders/${orderId}/comprobante`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el comprobante');
      setUploadCompDone(true);
      setCompFile(null);
    } catch (err) {
      setUploadCompError(err.message);
    } finally {
      setUploadingComp(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    if (orderConfirmedData) setTimeout(() => {
      setOrderConfirmedData(null);
      setUploadCompDone(false);
      setCompFile(null);
    }, 400);
  }

  const hasPaymentMethods = paymentSettings && !paymentSettings.not_configured &&
    (paymentSettings.transfer_enabled || paymentSettings.mp_enabled);

  const showDeliveryOption = deliverySettings?.delivery_enabled;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh',
        width: isOpen ? 'min(380px, 100vw)' : '0', maxWidth: '100vw',
        background: 'var(--store-panel-bg, #fafaf8)', zIndex: 1000,
        transition: 'width 0.3s ease', overflow: 'hidden',
        borderLeft: '0.5px solid rgba(128,128,128,0.2)',
        color: 'var(--store-panel-text, #0f0f0f)',
      }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 16px', boxSizing: 'border-box' }}>

          {/* Header — fixed */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '0.5px solid rgba(128,128,128,0.2)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.5rem', margin: 0, letterSpacing: '0.04em', color: 'var(--store-panel-text, #0f0f0f)' }}>
              {orderConfirmedData ? '¡Pedido recibido!' : 'Carrito'}
            </h2>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--store-panel-text, #6b6560)', padding: '4px', lineHeight: 1, opacity: 0.6 }}>✕</button>
          </div>

          {/* ---- CONFIRMATION SCREEN ---- */}
          {orderConfirmedData ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e8f5e9', border: '2px solid #a5d6a7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.6rem', color: '#2e7d32' }}>✓</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 6px' }}>
                  ¡Recibimos tu pedido!
                </h3>
                <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 2px' }}>Estamos preparando tu compra</p>
              </div>

              {/* Order summary */}
              <div style={{ background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '6px', padding: '14px 16px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b6560' }}>Número de orden</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {orderConfirmedData.order_number || `#${orderConfirmedData.id}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b6560' }}>Método de pago</span>
                  <span>{orderConfirmedData.payment_method === 'mp' ? 'Mercado Pago' : 'Transferencia'}</span>
                </div>
                {orderConfirmedData.pickup_point_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#6b6560' }}>Retiro en</span>
                    <span style={{ textAlign: 'right', maxWidth: '55%' }}>{orderConfirmedData.pickup_point_name}</span>
                  </div>
                )}
                {orderConfirmedData.delivery_address && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#6b6560' }}>Envío a</span>
                    <span style={{ textAlign: 'right', maxWidth: '55%', fontSize: '0.72rem' }}>{orderConfirmedData.delivery_address}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '0.5px solid #e0dbd4', fontWeight: 600 }}>
                  <span>Total</span>
                  <span>${parseFloat(orderConfirmedData.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Comprobante upload — transfer only (P3) */}
              {orderConfirmedData.payment_method === 'transfer' && !uploadCompDone && (
                <div style={{ background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: '#92400e' }}>
                    Subí tu comprobante de pago
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: '0 0 10px', lineHeight: 1.5 }}>
                    Adjuntá el comprobante para agilizar la confirmación de tu pedido.
                  </p>
                  {uploadCompError && (
                    <p style={{ fontSize: '0.72rem', color: '#c0392b', margin: '0 0 8px' }}>{uploadCompError}</p>
                  )}
                  <input
                    type="file" accept="image/*,application/pdf"
                    ref={postCompRef}
                    onChange={e => setCompFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => postCompRef.current?.click()}
                    style={{ display: 'block', width: '100%', padding: '8px', border: '0.5px dashed #fcd34d', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', color: '#92400e', marginBottom: '8px', boxSizing: 'border-box' }}
                  >
                    {compFile ? `📎 ${compFile.name}` : '+ Seleccionar imagen o PDF'}
                  </button>
                  {compFile && (
                    <button
                      onClick={() => handleUploadComp(orderConfirmedData.id)}
                      disabled={uploadingComp}
                      style={{ width: '100%', background: uploadingComp ? '#ccc' : '#92400e', color: '#fff', border: 'none', borderRadius: '2px', padding: '10px', cursor: uploadingComp ? 'not-allowed' : 'pointer', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', boxSizing: 'border-box' }}
                    >
                      {uploadingComp ? 'Subiendo...' : 'Subir comprobante'}
                    </button>
                  )}
                </div>
              )}
              {uploadCompDone && (
                <div style={{ background: '#e8f5e9', border: '0.5px solid #a5d6a7', borderRadius: '4px', padding: '10px 14px', color: '#2e7d32', fontSize: '0.78rem' }}>
                  ✓ Comprobante enviado correctamente
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
                <Link href="/profile/orders" onClick={handleClose}
                  style={{ display: 'block', width: '100%', background: '#0f0f0f', color: '#fafaf8', padding: '13px', borderRadius: '2px', textDecoration: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', boxSizing: 'border-box' }}>
                  Ver mis pedidos →
                </Link>
                <button onClick={handleClose}
                  style={{ width: '100%', background: 'none', color: '#6b6560', border: '0.5px solid #e0dbd4', padding: '11px', borderRadius: '2px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Seguir comprando
                </button>
              </div>
            </div>

          ) : (
            /* ---- ITEMS + FOOTER — single scrollable area (P1) ---- */
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div>
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
                        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--store-panel-text, #0f0f0f)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                          {item.size && (
                            <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', fontSize: '0.68rem', color: '#6b6560', fontWeight: 500, flexShrink: 0 }}>
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', fontSize: '0.68rem', color: '#6b6560', fontWeight: 500, flexShrink: 0 }}>
                              {item.color}
                            </span>
                          )}
                        </p>
                        <p style={{ margin: '0 0 12px', color: 'var(--store-panel-text, #6b6560)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', opacity: 0.7 }}>${parseFloat(item.price).toFixed(2)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '26px', height: '26px', border: '0.5px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--store-panel-text, #0f0f0f)' }}>−</button>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', minWidth: '20px', textAlign: 'center', color: 'var(--store-panel-text, #0f0f0f)' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '26px', height: '26px', border: '0.5px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--store-panel-text, #0f0f0f)' }}>+</button>
                          <button onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '0.75rem', fontFamily: 'var(--font-sans)' }}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ---- FOOTER ---- */}
              {items.length > 0 && (
                <div style={{ paddingTop: '16px', borderTop: '0.5px solid rgba(128,128,128,0.2)' }}>

                  {/* Coupon */}
                  {session && storeSlug && !appliedCoupon && (
                    <form onSubmit={handleApplyCoupon} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '6px' }}>¿Tenés un cupón?</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Código de cupón"
                          style={{ flex: 1, padding: '7px 10px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontSize: '0.78rem', outline: 'none', borderRadius: '2px', fontFamily: 'monospace', letterSpacing: '0.08em' }} />
                        <button type="submit" disabled={couponLoading || !couponCode.trim()}
                          style={{ padding: '7px 12px', background: '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.65rem', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                          {couponLoading ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && <p style={{ fontSize: '0.65rem', color: '#c0392b', margin: '4px 0 0' }}>{couponError}</p>}
                    </form>
                  )}

                  {appliedCoupon && (
                    <div style={{ marginBottom: '12px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: '#166534' }}>✓ Cupón: -{appliedCoupon.discount_percentage}%</span>
                      <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '0.7rem', padding: 0 }}>✕</button>
                    </div>
                  )}

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: appliedCoupon ? '4px' : '14px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--store-panel-text, #6b6560)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--store-panel-text, #0f0f0f)', textDecoration: appliedCoupon ? 'line-through' : 'none', opacity: appliedCoupon ? 0.5 : 1 }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#166534', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Con descuento</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: '#166534' }}>${discountedTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6b6560', letterSpacing: '0.06em' }}>+ Envío</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#6b6560' }}>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                  {(appliedCoupon || deliveryCost > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingTop: '6px', borderTop: '0.5px solid #e0dbd4' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total final</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: '#0f0f0f' }}>${finalTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* ---- DELIVERY OPTIONS ---- */}
                  {session && (pickupPoints.length > 0 || showDeliveryOption) && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '8px' }}>
                        ¿Cómo querés recibir tu pedido?
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                        {/* Pickup points */}
                        {pickupPoints.map(p => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '9px 11px', border: `0.5px solid ${selectedPoint === String(p.id) ? '#0f0f0f' : '#e0dbd4'}`, borderRadius: '3px', background: selectedPoint === String(p.id) ? '#f5f3f0' : '#fafaf8' }}>
                            <input
                              type="radio" name="delivery_option" value={String(p.id)}
                              checked={selectedPoint === String(p.id)}
                              onChange={() => { setSelectedPoint(String(p.id)); setDeliveryMethod('pickup'); setDeliveryAvail(null); setCheckoutError(''); }}
                              style={{ marginTop: '2px', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--store-panel-text, #0f0f0f)' }}>{p.name}</div>
                              {p.address && <div style={{ fontSize: '0.7rem', color: '#6b6560', marginTop: '1px' }}>{p.address}</div>}
                              {p.description && <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '1px' }}>{p.description}</div>}
                            </div>
                          </label>
                        ))}

                        {showDeliveryOption && pickupPoints.length > 0 && (
                          <div style={{ borderTop: '0.5px solid #e0dbd4', margin: '2px 0' }} />
                        )}

                        {/* Home delivery */}
                        {showDeliveryOption && (
                          <>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '9px 11px', border: `0.5px solid ${deliveryMethod === 'delivery' ? '#0f0f0f' : '#e0dbd4'}`, borderRadius: '3px', background: deliveryMethod === 'delivery' ? '#f5f3f0' : '#fafaf8' }}>
                              <input
                                type="radio" name="delivery_option" value="delivery"
                                checked={deliveryMethod === 'delivery'}
                                onChange={() => { setSelectedPoint(''); setDeliveryMethod('delivery'); setDeliveryAvail(null); setCheckoutError(''); }}
                                style={{ marginTop: '2px', flexShrink: 0 }}
                              />
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--store-panel-text, #0f0f0f)' }}>
                                  Envío a domicilio
                                  {deliverySettings?.delivery_cost > 0 && (
                                    <span style={{ fontWeight: 400, color: '#6b6560', fontSize: '0.72rem', marginLeft: '6px' }}>
                                      +${parseFloat(deliverySettings.delivery_cost).toFixed(0)}
                                    </span>
                                  )}
                                </div>
                                {deliveryMethod !== 'delivery' && (
                                  <div style={{ fontSize: '0.68rem', color: '#6b6560', marginTop: '1px' }}>
                                    Ingresá tu dirección para ver si llegamos
                                  </div>
                                )}
                              </div>
                            </label>

                            {/* Delivery form (expandable) */}
                            {deliveryMethod === 'delivery' && (
                              <div style={{ paddingLeft: '10px', paddingRight: '2px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                {savedAddress?.full_address && !usingCustomAddr ? (
                                  <div>
                                    <div style={{ padding: '9px 11px', background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '3px', fontSize: '0.78rem', marginBottom: '4px' }}>
                                      <div style={{ color: '#6b6560', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>Tu domicilio</div>
                                      <div style={{ color: '#0f0f0f', lineHeight: 1.4 }}>{savedAddress.full_address}</div>
                                    </div>
                                    <button onClick={() => { setUsingCustomAddr(true); setDeliveryAvail(null); }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '0.65rem', textDecoration: 'underline', padding: 0 }}>
                                      Usar otra dirección
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      type="text"
                                      value={deliveryAddress}
                                      onChange={e => handleAddressChange(e.target.value)}
                                      onFocus={() => addressSuggestions.length && setShowAddrSugg(true)}
                                      onBlur={() => setTimeout(() => setShowAddrSugg(false), 200)}
                                      placeholder="Ej: Av. 44 463, La Plata"
                                      style={{ width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontSize: '0.78rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }}
                                    />
                                    {showAddrSugg && addressSuggestions.length > 0 && (
                                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '180px', overflowY: 'auto' }}>
                                        {addressSuggestions.map((s, i) => (
                                          <div key={i} onMouseDown={() => handleSelectAddress(s)}
                                            style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '0.72rem', borderBottom: i < addressSuggestions.length - 1 ? '0.5px solid #f0ede8' : 'none', lineHeight: 1.4 }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                          >
                                            {s.display_name}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {checkingDelivery && (
                                  <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: 0 }}>Verificando cobertura...</p>
                                )}
                                {deliveryAvail && !checkingDelivery && (
                                  <div style={{
                                    padding: '8px 12px', borderRadius: '4px', fontSize: '0.75rem',
                                    background: deliveryAvail.available ? '#f0fdf4' : '#fef2f2',
                                    border: `0.5px solid ${deliveryAvail.available ? '#bbf7d0' : '#fecaca'}`,
                                    color: deliveryAvail.available ? '#166534' : '#c0392b',
                                  }}>
                                    {deliveryAvail.available ? '✓' : '✗'} {deliveryAvail.message}
                                  </div>
                                )}

                                {deliverySettings?.store_lat && deliverySettings?.store_lng && deliveryAvail && !checkingDelivery && (
                                  <div style={{ borderRadius: '6px', overflow: 'hidden', border: '0.5px solid #e0dbd4' }}>
                                    <MapWithRadius
                                      storeLat={deliverySettings.store_lat}
                                      storeLng={deliverySettings.store_lng}
                                      radiusKm={deliverySettings.delivery_radius_km || 5}
                                      userLat={usingCustomAddr ? deliveryLat : (savedAddress?.lat || null)}
                                      userLng={usingCustomAddr ? deliveryLng : (savedAddress?.lng || null)}
                                      height={180}
                                    />
                                    <p style={{ fontSize: '0.6rem', color: '#6b6560', padding: '5px 10px', background: '#f5f3f0', margin: 0 }}>
                                      Radio de cobertura: {deliverySettings.delivery_radius_km || 5} km
                                      {deliveryAvail.distance != null && ` · Tu dirección: ${deliveryAvail.distance} km`}
                                    </p>
                                  </div>
                                )}

                                {usingCustomAddr && deliveryLat && deliveryAvail?.available && (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: '#6b6560' }}>
                                    <input type="checkbox" checked={saveAddrToProfile} onChange={e => setSaveAddrToProfile(e.target.checked)} />
                                    Guardar esta dirección en mi perfil
                                  </label>
                                )}

                                {usingCustomAddr && savedAddress && (
                                  <button onClick={() => { setUsingCustomAddr(false); setDeliveryAddress(''); setDeliveryAvail(null); setDeliveryLat(null); setDeliveryLng(null); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '0.65rem', textDecoration: 'underline', padding: 0 }}>
                                    ← Usar mi domicilio guardado
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No payment methods */}
                  {session && paymentSettings && !paymentSettings.not_configured && !paymentSettings.transfer_enabled && !paymentSettings.mp_enabled && (
                    <div style={{ background: '#fafaf8', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '12px 14px', fontSize: '0.78rem', color: '#6b6560', textAlign: 'center', marginBottom: '8px' }}>
                      Este local aún no tiene métodos de pago configurados.
                    </div>
                  )}

                  {/* PAGAR button */}
                  {session ? (
                    hasPaymentMethods && (
                      <button
                        onClick={handlePagarClick}
                        disabled={checkoutLoading}
                        style={{
                          width: '100%', padding: '15px', borderRadius: '4px',
                          background: checkoutLoading ? '#888' : '#0f0f0f',
                          color: '#fafaf8', border: 'none',
                          fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
                          fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                          cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s',
                          marginBottom: '8px',
                        }}
                      >
                        {checkoutLoading ? 'Procesando...' : `PAGAR $${finalTotal.toFixed(2)}`}
                      </button>
                    )
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: '0 0 12px', lineHeight: 1.5 }}>
                        Para finalizar tu compra necesitás iniciar sesión
                      </p>
                      <Link href={`/login?callbackUrl=${typeof window !== 'undefined' ? window.location.pathname : '/'}`} onClick={handleClose}
                        style={{ display: 'block', width: '100%', background: '#0f0f0f', color: '#fafaf8', padding: '14px', borderRadius: '2px', textDecoration: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center', boxSizing: 'border-box' }}>
                        Ingresar para comprar
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========== MODAL: Selección de método de pago ========== */}
      {showPaymentModal && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div style={modalBox}>
            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.3rem', margin: 0 }}>¿Cómo querés pagar?</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6b6560', padding: '4px', lineHeight: 1, opacity: 0.6 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {paymentSettings?.transfer_enabled && (
                <button
                  onClick={() => { setShowPaymentModal(false); setShowTransferModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '18px 20px', border: '1.5px solid #e0dbd4', borderRadius: '8px',
                    background: '#fafaf8', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f0f0f'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>🏦</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: '#0f0f0f', marginBottom: '3px' }}>Transferencia bancaria</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6b6560' }}>Acreditación en minutos</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#6b6560', fontSize: '1.1rem' }}>›</div>
                </button>
              )}

              {paymentSettings?.mp_enabled && (
                <button
                  onClick={() => { setShowPaymentModal(false); handlePayWithMP(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '18px 20px', border: '1.5px solid #e0dbd4', borderRadius: '8px',
                    background: '#fafaf8', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#009ee3'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,158,227,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: '#0f0f0f', marginBottom: '3px' }}>Tarjeta de débito, crédito, efectivo y más</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6b6560', marginBottom: '6px' }}>Pagá con Mercado Pago</div>
                    <div style={{ display: 'inline-block', background: '#009ee3', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '0.58rem', letterSpacing: '0.06em' }}>
                      Visa · Mastercard · Amex y más
                    </div>
                  </div>
                  <div style={{ color: '#6b6560', fontSize: '1.1rem', flexShrink: 0 }}>›</div>
                </button>
              )}

              <p style={{ fontSize: '0.68rem', color: '#aaa', textAlign: 'center', margin: '4px 0 0' }}>
                Total a pagar: <strong style={{ color: '#0f0f0f' }}>${finalTotal.toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Transfer details ========== */}
      {showTransferModal && paymentSettings?.transfer_enabled && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowTransferModal(false)}>
          <div style={modalBox}>
            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: 0 }}>Datos para transferir</h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6b6560', padding: '4px', lineHeight: 1, opacity: 0.6 }}>✕</button>
            </div>

            <div style={{ padding: '16px 24px 24px' }}>

              {/* Bank details */}
              <div style={{ background: '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                {paymentSettings.transfer_holder && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}>Titular</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '2px 0 0', color: '#0f0f0f' }}>{paymentSettings.transfer_holder}</p>
                  </div>
                )}
                {paymentSettings.transfer_bank && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}>Banco / Billetera</span>
                    <p style={{ fontSize: '0.85rem', margin: '2px 0 0', color: '#0f0f0f' }}>{paymentSettings.transfer_bank}</p>
                  </div>
                )}
                {paymentSettings.transfer_cbu && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}>CBU</span>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f0f0f', letterSpacing: '0.04em' }}>{paymentSettings.transfer_cbu}</span>
                      <CopyButton text={paymentSettings.transfer_cbu} />
                    </div>
                  </div>
                )}
                {paymentSettings.transfer_alias && (
                  <div>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}>Alias</span>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f0f0f', letterSpacing: '0.04em' }}>{paymentSettings.transfer_alias}</span>
                      <CopyButton text={paymentSettings.transfer_alias} />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', margin: '0 0 4px' }}>Monto a transferir</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, margin: 0, color: '#0f0f0f' }}>${finalTotal.toFixed(2)}</p>
              </div>

              {checkoutError && (
                <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px 12px', borderRadius: '4px', marginBottom: '12px', color: '#c0392b', fontSize: '0.78rem' }}>
                  {checkoutError}
                </div>
              )}

              <button
                onClick={handleConfirmTransfer}
                disabled={checkoutLoading}
                style={{
                  width: '100%', padding: '15px', borderRadius: '4px',
                  background: checkoutLoading ? '#888' : '#0f0f0f',
                  color: '#fafaf8', border: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
                  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {checkoutLoading ? 'Procesando...' : 'Confirmar pedido — Transferencia'}
              </button>
              <p style={{ fontSize: '0.65rem', color: '#aaa', textAlign: 'center', margin: '8px 0 0' }}>
                Podrás subir el comprobante en el siguiente paso
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
