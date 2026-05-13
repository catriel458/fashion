'use client';

// Vista previa en vivo del header y footer de una tienda.
// Recibe el objeto `form` con todos los campos del formulario de personalización.
export default function StoreHeaderFooterPreview({ form }) {
  const headerBg    = form.header_color    || 'rgba(250,250,248,0.95)';
  const headerText  = form.header_text_color || '#0f0f0f';
  const headerFont  = form.header_font     || 'var(--font-sans)';
  const headerSize  = form.header_font_size || '0.68rem';
  const nameColor   = form.header_text_color || form.primary_color || '#009aae';

  const footerBg    = form.footer_color    || '#fafaf8';
  const footerText  = form.footer_text_color || '#1a1a1a';
  const footerFont  = form.footer_font     || 'var(--font-serif)';
  const footerSize  = form.footer_font_size || '1.1rem';

  const panelBg     = form.panel_bg_color   || '#fafaf8';
  const panelText   = form.panel_text_color || '#0f0f0f';

  const storeName  = form.name    || 'Nombre de la tienda';
  const tagline    = form.tagline || '';

  const iconBtnStyle = {
    background: 'none', border: 'none', padding: '6px',
    color: headerText, cursor: 'default',
    display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e0dbd4' }}>

      {/* ── HEADER PREVIEW ── */}
      <div style={{ marginBottom: 0 }}>
        <div style={{
          background: '#f0ede8', padding: '6px 12px',
          fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#6b6560', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span>▬</span> Vista previa — Header (navbar)
        </div>

        <div style={{
          background: headerBg,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: `0.5px solid ${headerText}15`,
          flexWrap: 'nowrap', overflow: 'hidden',
        }}>
          {/* CnB logo */}
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, letterSpacing: '0.08em', color: headerText, whiteSpace: 'nowrap', flexShrink: 0 }}>
            CnB
          </span>
          <span style={{ color: headerText, opacity: 0.3, fontSize: '0.9rem', flexShrink: 0 }}>/</span>

          {/* Store name */}
          <span style={{
            color: nameColor,
            fontFamily: headerFont,
            fontSize: headerSize,
            letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {storeName}
          </span>

          {/* Category links */}
          <div style={{ display: 'flex', gap: '12px', flex: 1, overflow: 'hidden' }}>
            {['Remeras', 'Pantalones', 'Abrigos'].map(cat => (
              <span key={cat} style={{
                color: headerText, opacity: 0.65,
                fontFamily: headerFont, fontSize: headerSize,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {cat}
              </span>
            ))}
          </div>

          {/* Icons */}
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {/* Fitting room */}
            <span style={iconBtnStyle} title="Vestidor virtual">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 21v-1a5 5 0 0110 0v1"/>
              </svg>
            </span>
            {/* Cart */}
            <span style={iconBtnStyle} title="Carrito">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTER PREVIEW ── */}
      <div>
        <div style={{
          background: '#f0ede8', padding: '6px 12px',
          fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#6b6560', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', gap: '6px',
          borderTop: '0.5px solid #e0dbd4',
        }}>
          <span>▬</span> Vista previa — Footer
        </div>

        <div style={{ background: footerBg, padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '16px' }}>

            {/* Marca */}
            <div style={{ minWidth: '160px' }}>
              <div style={{ fontFamily: footerFont, fontSize: footerSize, color: footerText, letterSpacing: '0.06em', marginBottom: '6px' }}>
                {storeName}
              </div>
              {tagline && (
                <div style={{ fontFamily: footerFont, fontSize: '0.72rem', color: footerText, opacity: 0.7 }}>
                  {tagline}
                </div>
              )}
            </div>

            {/* Contacto */}
            {(form.contact_email || form.contact_phone) && (
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: footerText, opacity: 0.55, marginBottom: '8px' }}>Contacto</div>
                {form.contact_email && <div style={{ fontFamily: footerFont, fontSize: '0.75rem', color: footerText, marginBottom: '4px' }}>{form.contact_email}</div>}
                {form.contact_phone && <div style={{ fontFamily: footerFont, fontSize: '0.75rem', color: footerText }}>{form.contact_phone}</div>}
              </div>
            )}

            {/* Redes */}
            {(form.social_instagram || form.social_whatsapp || form.social_facebook) && (
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: footerText, opacity: 0.55, marginBottom: '8px' }}>Seguinos</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {form.social_instagram && <span style={{ fontFamily: footerFont, fontSize: '0.72rem', color: footerText, opacity: 0.85, padding: '4px 10px', border: `0.5px solid ${footerText}40`, borderRadius: '4px' }}>Instagram</span>}
                  {form.social_whatsapp  && <span style={{ fontFamily: footerFont, fontSize: '0.72rem', color: footerText, opacity: 0.85, padding: '4px 10px', border: `0.5px solid ${footerText}40`, borderRadius: '4px' }}>WhatsApp</span>}
                  {form.social_facebook  && <span style={{ fontFamily: footerFont, fontSize: '0.72rem', color: footerText, opacity: 0.85, padding: '4px 10px', border: `0.5px solid ${footerText}40`, borderRadius: '4px' }}>Facebook</span>}
                </div>
              </div>
            )}
          </div>

          {/* Copyright bar */}
          <div style={{ borderTop: `0.5px solid ${footerText}20`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: footerText, opacity: 0.5 }}>CnB</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: footerText, opacity: 0.4 }}>
              © {new Date().getFullYear()} CnB · {storeName}
            </span>
          </div>
        </div>
      </div>

      {/* ── PANEL (carrito / vestidor) PREVIEW ── */}
      <div>
        <div style={{
          background: '#f0ede8', padding: '6px 12px',
          fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#6b6560', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', gap: '6px',
          borderTop: '0.5px solid #e0dbd4',
        }}>
          <span>▬</span> Vista previa — Carrito / Vestidor
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Panel del carrito */}
          <div style={{ background: panelBg, padding: '16px', borderRight: '0.5px solid #e0dbd4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: `0.5px solid ${panelText}20` }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: panelText, letterSpacing: '0.04em' }}>Carrito</span>
              <span style={{ color: panelText, opacity: 0.5, fontSize: '0.9rem', cursor: 'default' }}>✕</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: 48, height: 56, background: `${panelText}15`, borderRadius: '4px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '8px', background: `${panelText}25`, borderRadius: '4px', marginBottom: '6px', width: '80%' }} />
                <div style={{ height: '7px', background: `${panelText}15`, borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
            <div style={{ borderTop: `0.5px solid ${panelText}20`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: panelText, opacity: 0.6 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: panelText }}>$1.234</span>
            </div>
            <div style={{ marginTop: '10px', background: panelText, color: panelBg, padding: '8px', borderRadius: '2px', textAlign: 'center', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
              Finalizar compra
            </div>
          </div>

          {/* Panel del vestidor */}
          <div style={{ background: panelBg, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: `0.5px solid ${panelText}20` }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: panelText, letterSpacing: '0.04em' }}>Tu vestidor</span>
              <span style={{ color: panelText, opacity: 0.5, fontSize: '0.9rem', cursor: 'default' }}>✕</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <svg viewBox="0 0 60 140" width="40" height="90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.4 }}>
                <circle cx="30" cy="12" r="10" stroke={panelText} strokeWidth="1.5"/>
                <rect x="15" y="26" width="30" height="44" rx="4" stroke={panelText} strokeWidth="1.5"/>
                <line x1="15" y1="32" x2="4" y2="66" stroke={panelText} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="45" y1="32" x2="56" y2="66" stroke={panelText} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="22" y1="70" x2="18" y2="110" stroke={panelText} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="38" y1="70" x2="42" y2="110" stroke={panelText} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ background: panelText, color: panelBg, padding: '8px', borderRadius: '2px', textAlign: 'center', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
              Probarme este outfit →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
