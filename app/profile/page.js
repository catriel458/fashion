'use client';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';


const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560',
};
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: '0.5px solid #e0dbd4', background: '#fafaf8',
  fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
  outline: 'none', borderRadius: '2px',
  boxSizing: 'border-box', color: '#0f0f0f',
};


function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #e0dbd4', background: '#f5f3f0' }}>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6560' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '22px 20px' }}>{children}</div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
      background: type === 'error' ? '#c0392b' : '#2e7d32', color: '#fff',
      padding: '12px 18px', borderRadius: '4px', fontSize: '0.82rem',
      fontFamily: 'var(--font-sans)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [toast, setToast] = useState(null);

  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [uploadingAvatar,    setUploadingAvatar]    = useState(false);
  const [deletingAvatar,     setDeletingAvatar]     = useState(false);
  const [deletingAccount,    setDeletingAccount]    = useState(false);
  const [confirmDelete,      setConfirmDelete]      = useState(false);
  const [verifyCooldown,     setVerifyCooldown]     = useState(0);
  const [verifySending,      setVerifySending]      = useState(false);
  const [verifySent,         setVerifySent]         = useState(false);
  const [bodyPhotoUrl,       setBodyPhotoUrl]       = useState(null);
  const [bodyPhotoPreview,   setBodyPhotoPreview]   = useState(null);
  const [uploadingBodyPhoto, setUploadingBodyPhoto] = useState(false);
  const [deletingBodyPhoto,  setDeletingBodyPhoto]  = useState(false);
  const [savedAddress,       setSavedAddress]       = useState(null);
  const [addressInput,       setAddressInput]       = useState('');
  const [addressLat,         setAddressLat]         = useState(null);
  const [addressLng,         setAddressLng]         = useState(null);
  const [addressSugg,        setAddressSugg]        = useState([]);
  const [showAddrSugg,       setShowAddrSugg]       = useState(false);
  const [savingAddress,      setSavingAddress]      = useState(false);
  const avatarInputRef    = useRef(null);
  const bodyPhotoInputRef = useRef(null);
  const addrDebounceRef   = useRef(null);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [savedTryons, setSavedTryons] = useState([]);
  const [loadingWishlistId, setLoadingWishlistId] = useState(null);
  const [selectedLook, setSelectedLook] = useState(null);

  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const t = setTimeout(() => setVerifyCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [verifyCooldown]);

  async function handleResendVerification() {
    if (verifyCooldown > 0 || verifySending || !user) return;
    setVerifySending(true);
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setVerifySent(true);
      setVerifyCooldown(60);
      setTimeout(() => setVerifySent(false), 5000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setVerifySending(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (!session?.user) return;

    fetch('/api/wishlist')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWishlistItems(d); })
      .catch(() => {});

    fetch('/api/tryon/saved')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSavedTryons(d); })
      .catch(() => {});
  }, [session]);

  const handleDeleteWishlistItem = async (productId) => {
    setLoadingWishlistId(productId);
    try {
      const res = await fetch(`/api/wishlist?product_id=${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        showToast("Eliminado de favoritos");
      } else {
        showToast("Error al eliminar", "error");
      }
    } catch {
      showToast("Error al eliminar", "error");
    } finally {
      setLoadingWishlistId(null);
    }
  };

  const handleDeleteSavedTryon = async (id) => {
    try {
      const res = await fetch(`/api/tryon/saved?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedTryons(prev => prev.filter(item => item.id !== id));
        showToast("Look eliminado");
      } else {
        showToast("Error al eliminar", "error");
      }
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleDownload = async (imageUrl, filename) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'tnb-look.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      a.download = filename || 'tnb-look.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/profile/address')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setSavedAddress(d);
          setAddressInput(d.full_address || '');
          setAddressLat(d.lat ?? null);
          setAddressLng(d.lng ?? null);
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/profile/body-photo')
      .then(r => r.json())
      .then(d => { if (d.body_photo_url) setBodyPhotoUrl(d.body_photo_url); })
      .catch(() => {});
  }, [session]);

  const user = session?.user;
  const form = profileForm || {
    username:   user?.username   || '',
    email:      user?.email      || '',
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    birth_date: user?.birth_date ? user.birth_date.substring(0, 10) : '',
    height:     user?.height     || '',
    weight:     user?.weight     || '',
  };

  const hasPersonalData = user?.first_name || user?.last_name || user?.birth_date || user?.height || user?.weight;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await updateSession({
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        height: data.height,
        weight: data.weight,
      });
      setProfileForm(null);
      showToast('Datos actualizados correctamente');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Contraseña actualizada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await updateSession({ avatar_url: data.avatar_url });
      showToast('Foto de perfil actualizada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleBodyPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBodyPhotoPreview(URL.createObjectURL(file));
    setUploadingBodyPhoto(true);
    try {
      const fd = new FormData();
      fd.append('body_photo', file);
      const res = await fetch('/api/profile/body-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBodyPhotoUrl(data.body_photo_url);
      showToast('Foto del probador actualizada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingBodyPhoto(false);
    }
  }

  async function handleDeleteAvatar() {
    setDeletingAvatar(true);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await updateSession({ avatar_url: null });
      showToast('Foto de perfil eliminada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingAvatar(false);
    }
  }

  async function handleDeleteBodyPhoto() {
    setDeletingBodyPhoto(true);
    try {
      const res = await fetch('/api/profile/body-photo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBodyPhotoUrl(null);
      setBodyPhotoPreview(null);
      showToast('Foto del probador eliminada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingBodyPhoto(false);
    }
  }

  function handleAddressInputChange(value) {
    setAddressInput(value);
    setAddressLat(null);
    setAddressLng(null);
    clearTimeout(addrDebounceRef.current);
    if (value.length < 3) { setAddressSugg([]); return; }
    addrDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setAddressSugg(Array.isArray(data) ? data.slice(0, 5) : []);
        setShowAddrSugg(true);
      } catch { setAddressSugg([]); }
    }, 500);
  }

  function handleSelectAddress(s) {
    setAddressInput(s.display_name);
    setAddressLat(parseFloat(s.lat));
    setAddressLng(parseFloat(s.lon));
    setAddressSugg([]);
    setShowAddrSugg(false);
  }

  async function handleSaveAddress(e) {
    e.preventDefault();
    if (!addressInput.trim()) return;
    setSavingAddress(true);
    try {
      const res = await fetch('/api/profile/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_address: addressInput.trim(), lat: addressLat, lng: addressLng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedAddress(data);
      showToast('Domicilio guardado correctamente');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al eliminar');
      await signOut({ callbackUrl: '/stores' });
    } catch {
      showToast('No se pudo eliminar la cuenta', 'error');
      setDeletingAccount(false);
    }
  }

  if (!user) return null;

  const initials = (user.username?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-light)', fontFamily: 'var(--font-sans)' }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div style={{ background: '#0f0f0f', padding: '0 0 0 0' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px clamp(1.2rem, 4vw, 2.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <img
                src="/tnb.png"
                alt="TnB"
                style={{
                  height: '24px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Link>
            <Link href="/stores" style={{
              textDecoration: 'none',
              color: '#d4c5b0',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: '0.5px solid rgba(212, 197, 176, 0.4)',
              padding: '6px 14px',
              borderRadius: '2px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#fff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(212, 197, 176, 0.4)';
              e.currentTarget.style.color = '#d4c5b0';
            }}
            >
              ← Volver a tiendas
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: '1.4rem', fontFamily: 'var(--font-serif)' }}>{initials}</span>
              }
            </div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 300 }}>{user.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '2px' }}>{user.email}</div>
              {user.email_verified === false && (
                <div style={{ fontSize: '0.65rem', color: '#fde047', marginTop: '4px' }}>⚠ Email no verificado</div>
              )}
            </div>
          </div>

          {/* Tabs nav */}
          <div style={{
            display: 'flex', gap: '24px', marginTop: '20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
          }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              ...(user.role === 'visitor' ? [{ label: 'Mis compras', href: '/profile/orders' }] : []),
              { label: 'Mis beneficios', href: '/profile/benefits' },
              { label: 'Notificaciones', href: '/profile/notifications' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: href === '/profile' ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', paddingBottom: '12px',
                borderBottom: href === '/profile' ? '1.5px solid #fff' : 'none',
                flexShrink: 0,
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px clamp(1.2rem, 4vw, 2.5rem) 48px' }}>

        {/* Mis favoritos */}
        <Section title="Mis favoritos">
          {wishlistItems.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: 0 }}>
              Aun no tenes favoritos. Hace clic en el corazón en cualquier producto para guardarlo acá.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {wishlistItems.map(item => (
                <div key={item.id} style={{ border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden', background: '#fafaf8', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: '#f0ede8' }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {item.stock === 0 && (
                      <span style={{ position: 'absolute', top: 6, left: 6, background: '#c0392b', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 2, fontWeight: 500 }}>
                        Sin stock
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteWishlistItem(item.product_id)}
                      disabled={loadingWishlistId === item.product_id}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                      }}
                      title="Eliminar de favoritos"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.store_name}</p>
                      <h4 style={{ margin: '4px 0 2px', fontSize: '0.78rem', fontWeight: 500, color: '#0f0f0f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#0f0f0f' }}>${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <Link
                      href={`/store/${item.store_slug}/product/${item.slug}`}
                      style={{
                        display: 'block', textAlign: 'center', textDecoration: 'none',
                        background: '#0f0f0f', color: '#fff', fontSize: '0.68rem',
                        padding: '6px 0', borderRadius: '2px', marginTop: '10px',
                        textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'opacity 0.2s'
                      }}
                    >
                      Ver producto
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Mis looks */}
        <Section title="Mis looks">
          <style>{`
            .look-card-img-container:hover .look-hover-overlay {
              opacity: 1 !important;
            }
          `}</style>
          {savedTryons.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#6b6560', margin: 0 }}>
              Aun no guardaste ningun look. Usa el probador virtual y guarda tus combinaciones favoritas!
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {savedTryons.map(look => (
                <div key={look.id} style={{ border: '0.5px solid #e0dbd4', borderRadius: '4px', overflow: 'hidden', background: '#fafaf8', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div 
                    onClick={() => setSelectedLook(look)}
                    className="look-card-img-container"
                    style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: '#f0ede8', cursor: 'pointer' }}
                  >
                    <img src={look.result_image_url} alt="Look" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
                    }}
                    className="look-hover-overlay"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSavedTryon(look.id); }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)', border: 'none',
                        color: '#fff', fontSize: '0.65rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'background 0.2s',
                        zIndex: 2,
                      }}
                      title="Eliminar look"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{look.store_name}</p>
                      <p style={{ margin: '2px 0 6px', fontSize: '0.65rem', color: '#aaa' }}>
                        {new Date(look.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      {look.garment_names && (
                        <p style={{ margin: 0, fontSize: '0.68rem', color: '#6b6560', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={look.garment_names}>
                          {look.garment_names}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Datos de cuenta */}
        <Section title="Datos de cuenta">
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Usuario</label>
                <input type="text" required value={form.username}
                  onChange={e => setProfileForm({ ...form, username: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setProfileForm({ ...form, email: e.target.value })}
                  style={inputStyle} />
              </div>
            </div>

            {/* Datos personales */}
            <div style={{ borderTop: '0.5px solid #e0dbd4', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560', marginBottom: '14px' }}>
                Datos personales
              </div>
              {!hasPersonalData && !profileForm && (
                <div style={{ background: '#fef9c3', border: '0.5px solid #fde047', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '0.78rem', color: '#78350f' }}>
                  Completá tu perfil para recibir descuentos de cumpleaños 🎂
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input type="text" value={form.first_name}
                    onChange={e => setProfileForm({ ...form, first_name: e.target.value })}
                    style={inputStyle} placeholder="Tu nombre" />
                </div>
                <div>
                  <label style={labelStyle}>Apellido</label>
                  <input type="text" value={form.last_name}
                    onChange={e => setProfileForm({ ...form, last_name: e.target.value })}
                    style={inputStyle} placeholder="Tu apellido" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '14px', alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Fecha de nacimiento</label>
                  <input type="date" value={form.birth_date}
                    onChange={e => setProfileForm({ ...form, birth_date: e.target.value })}
                    style={inputStyle} />
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '4px 0 0' }}>
                    Para tu descuento de cumpleaños
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Altura (cm)</label>
                  <input type="number" min="50" max="250" value={form.height}
                    onChange={e => setProfileForm({ ...form, height: e.target.value })}
                    style={inputStyle} placeholder="Ej: 175" />
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '4px 0 0' }}>Para probador virtual</p>
                </div>
                <div>
                  <label style={labelStyle}>Peso (kg)</label>
                  <input type="number" min="20" max="300" value={form.weight}
                    onChange={e => setProfileForm({ ...form, weight: e.target.value })}
                    style={inputStyle} placeholder="Ej: 70" />
                  <p style={{ fontSize: '0.65rem', color: '#6b6560', margin: '4px 0 0' }}>Para probador virtual</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="submit" disabled={savingProfile} style={{
                background: savingProfile ? '#ccc' : '#0f0f0f', color: '#fafaf8',
                border: 'none', padding: '9px 20px', cursor: savingProfile ? 'not-allowed' : 'pointer',
                borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Section>

        {/* Cambiar contraseña */}
        <Section title="Cambiar contraseña">
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Contraseña actual</label>
              <input type="password" required value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                style={inputStyle} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Nueva contraseña</label>
                <input type="password" required minLength={6} value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div>
                <label style={labelStyle}>Confirmar contraseña</label>
                <input type="password" required value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="submit" disabled={savingPw} style={{
                background: savingPw ? '#ccc' : '#0f0f0f', color: '#fafaf8',
                border: 'none', padding: '9px 20px', cursor: savingPw ? 'not-allowed' : 'pointer',
                borderRadius: '2px', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {savingPw ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </Section>

        {/* Foto de perfil */}
        <Section title="Foto de perfil">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0ede8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '0.5px solid #e0dbd4' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.2rem', color: '#6b6560' }}>{initials}</span>
              }
            </div>
            <div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar || deletingAvatar}
                  style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: (uploadingAvatar || deletingAvatar) ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                  {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                {user.avatar_url && (
                  <button onClick={handleDeleteAvatar} disabled={uploadingAvatar || deletingAvatar}
                    style={{ border: '0.5px solid #f87171', background: 'none', color: '#dc2626', cursor: (uploadingAvatar || deletingAvatar) ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                    {deletingAvatar ? 'Eliminando...' : 'Eliminar foto'}
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: '6px 0 0' }}>JPG, PNG o WEBP. Máx 4 MB.</p>
            </div>
          </div>
        </Section>

        {/* Foto para el probador */}
        <Section title="Foto para el probador virtual">
          <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.6 }}>
            Usada en el vestidor virtual al probarte outfits. Subí una foto de cuerpo entero con buena iluminación.
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '72px', height: '96px', background: '#f0ede8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '0.5px solid #e0dbd4', borderRadius: '4px' }}>
              {(bodyPhotoPreview || bodyPhotoUrl)
                ? <img src={bodyPhotoPreview || bodyPhotoUrl} alt="Foto cuerpo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2rem', color: '#c8c4bc' }}>👤</span>
              }
            </div>
            <div>
              <input ref={bodyPhotoInputRef} type="file" accept="image/*" onChange={handleBodyPhotoChange} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => bodyPhotoInputRef.current?.click()} disabled={uploadingBodyPhoto || deletingBodyPhoto}
                  style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: (uploadingBodyPhoto || deletingBodyPhoto) ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                  {uploadingBodyPhoto ? 'Subiendo...' : bodyPhotoUrl ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {bodyPhotoUrl && (
                  <button onClick={handleDeleteBodyPhoto} disabled={uploadingBodyPhoto || deletingBodyPhoto}
                    style={{ border: '0.5px solid #f87171', background: 'none', color: '#dc2626', cursor: (uploadingBodyPhoto || deletingBodyPhoto) ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                    {deletingBodyPhoto ? 'Eliminando...' : 'Eliminar foto'}
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: '6px 0 0' }}>
                Foto de frente, cuerpo entero. JPG, PNG o WEBP.
              </p>
              {bodyPhotoUrl && !bodyPhotoPreview && (
                <p style={{ fontSize: '0.68rem', color: '#2e7d32', margin: '4px 0 0' }}>✓ Foto guardada</p>
              )}
            </div>
          </div>
        </Section>

        {/* Verificación de cuenta */}
        {user.email_verified === false && (
          <Section title="Verificación de cuenta">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#78350f' }}>Tu email no está verificado</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: 0, lineHeight: 1.6 }}>
                  Verificar tu email activa el probador virtual. Revisá tu bandeja de entrada o reenviá el mail.
                </p>
                {verifySent && (
                  <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '8px', fontWeight: 500 }}>
                    ✓ Mail enviado — revisá tu bandeja de entrada
                  </p>
                )}
              </div>
              <button
                onClick={handleResendVerification}
                disabled={verifySending || verifyCooldown > 0}
                style={{
                  border: '0.5px solid #e0dbd4', background: verifySending ? '#f0ede8' : '#0f0f0f',
                  color: verifySending ? '#aaa' : '#fff',
                  cursor: verifyCooldown > 0 || verifySending ? 'not-allowed' : 'pointer',
                  padding: '9px 18px', fontSize: '0.72rem', borderRadius: '2px',
                  letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap', opacity: verifyCooldown > 0 ? 0.6 : 1, flexShrink: 0,
                }}
              >
                {verifySending ? 'Enviando...' : verifyCooldown > 0 ? `Reenviar (${verifyCooldown}s)` : 'Reenviar email'}
              </button>
            </div>
          </Section>
        )}

        {/* Mi domicilio */}
        <Section title="Mi domicilio">
          <p style={{ fontSize: '0.78rem', color: '#6b6560', margin: '0 0 16px', lineHeight: 1.5 }}>
            Tu dirección de envío se usará al comprar en locales que ofrezcan delivery.
          </p>
          <form onSubmit={handleSaveAddress}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <label style={labelStyle}>Dirección</label>
              <input
                type="text"
                value={addressInput}
                onChange={e => handleAddressInputChange(e.target.value)}
                onFocus={() => addressSugg.length && setShowAddrSugg(true)}
                onBlur={() => setTimeout(() => setShowAddrSugg(false), 200)}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                style={inputStyle}
              />
              {showAddrSugg && addressSugg.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {addressSugg.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={() => handleSelectAddress(s)}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.78rem', borderBottom: i < addressSugg.length - 1 ? '0.5px solid #f0ede8' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f3f0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {savedAddress?.full_address && !addressLat && addressInput === savedAddress.full_address && (
              <p style={{ fontSize: '0.72rem', color: '#2e7d32', margin: '0 0 12px' }}>
                ✓ Domicilio guardado
              </p>
            )}
            <button
              type="submit"
              disabled={savingAddress || !addressInput.trim()}
              style={{
                padding: '9px 20px', background: savingAddress ? '#ccc' : '#0f0f0f', color: '#fff',
                border: 'none', cursor: savingAddress || !addressInput.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)',
              }}
            >
              {savingAddress ? 'Guardando...' : 'Guardar domicilio'}
            </button>
          </form>
        </Section>

        {/* Danger zone */}
        <Section title="Zona peligrosa">
          {!confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f0f0f', marginBottom: '4px' }}>Eliminar mi cuenta</div>
                <div style={{ fontSize: '0.78rem', color: '#6b6560' }}>Esta acción es irreversible. Todos tus datos serán eliminados.</div>
              </div>
              <button onClick={() => setConfirmDelete(true)} style={{ border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                Eliminar cuenta
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: '#c0392b', marginBottom: '16px', lineHeight: 1.5 }}>
                ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', fontFamily: 'var(--font-sans)' }}>
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={deletingAccount}
                  style={{ border: 'none', background: '#c0392b', color: '#fff', cursor: deletingAccount ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', fontFamily: 'var(--font-sans)' }}>
                  {deletingAccount ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Fullscreen Look Viewer & Downloader Modal */}
      {selectedLook && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, padding: '20px', animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedLook(null)}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes zoomIn {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div 
            style={{
              position: 'relative', maxWidth: '440px', width: '100%',
              background: '#fff', borderRadius: '8px', overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              animation: 'zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedLook(null)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                fontSize: '0.9rem', color: '#0f0f0f', fontWeight: 'bold',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✕
            </button>

            {/* Look Image */}
            <div style={{ position: 'relative', aspectRatio: '3/4', background: '#f5f3f0', overflow: 'hidden' }}>
              <img
                src={selectedLook.result_image_url}
                alt="Look Completo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Details and Actions */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>
                  {selectedLook.store_name}
                </span>
                <p style={{ margin: '2px 0 6px', fontSize: '0.68rem', color: '#aaa' }}>
                  Guardado el {new Date(selectedLook.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                {selectedLook.garment_names && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#6b6560', lineHeight: 1.5 }}>
                    <strong>Prendas probadas:</strong> {selectedLook.garment_names}
                  </p>
                )}
              </div>

              {/* Download Action */}
              <button
                onClick={() => handleDownload(selectedLook.result_image_url, `look-${selectedLook.id}.png`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#0f0f0f', color: '#fff', border: 'none', borderRadius: '4px',
                  padding: '12px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, transform 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f0f0f'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar Look
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
