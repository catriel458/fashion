'use client';

import { useCart } from './CartContext';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total } = useCart();

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh',
        width: isOpen ? '380px' : '0',
        maxWidth: '100vw',
        background: '#fafaf8',
        zIndex: 1000,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        borderLeft: '0.5px solid #e0dbd4',
      }}>
        <div style={{
          width: '380px', maxWidth: '100vw', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '24px',
          boxSizing: 'border-box',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', paddingBottom: '16px',
            borderBottom: '0.5px solid #e0dbd4',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: '1.5rem', margin: 0, letterSpacing: '0.04em',
            }}>
              Carrito
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', color: '#6b6560', padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🛍️</div>
                Tu carrito está vacío
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', gap: '12px',
                  padding: '16px 0',
                  borderBottom: '0.5px solid #e0dbd4',
                }}>
                  <div style={{
                    width: '72px', height: '88px',
                    background: '#f0ede8', borderRadius: '4px',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}>
                        👕
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: '#0f0f0f',
                    }}>
                      {item.name}
                    </p>
                    <p style={{
                      margin: '0 0 12px 0',
                      color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                    }}>
                      ${parseFloat(item.price).toFixed(2)}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        style={{
                          width: '26px', height: '26px',
                          border: '0.5px solid #e0dbd4', background: 'none',
                          cursor: 'pointer', borderRadius: '2px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', color: '#0f0f0f',
                        }}
                      >
                        −
                      </button>
                      <span style={{
                        fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                        minWidth: '20px', textAlign: 'center',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        style={{
                          width: '26px', height: '26px',
                          border: '0.5px solid #e0dbd4', background: 'none',
                          cursor: 'pointer', borderRadius: '2px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', color: '#0f0f0f',
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          cursor: 'pointer', color: '#c0392b',
                          fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
                        }}
                      >
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
            <div style={{
              paddingTop: '16px',
              borderTop: '0.5px solid #e0dbd4',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '16px',
              }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#6b6560', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Total
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400 }}>
                  ${total.toFixed(2)}
                </span>
              </div>
              <button style={{
                width: '100%', background: '#0f0f0f', color: '#fafaf8',
                border: 'none', padding: '14px',
                fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: 'pointer', borderRadius: '2px',
              }}>
                Finalizar compra
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
