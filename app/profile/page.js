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
  const [deletingAccount,    setDeletingAccount]    = useState(false);
  const [confirmDelete,      setConfirmDelete]      = useState(false);
  const [bodyPhotoUrl,       setBodyPhotoUrl]       = useState(null);
  const [bodyPhotoPreview,   setBodyPhotoPreview]   = useState(null);
  const [uploadingBodyPhoto, setUploadingBodyPhoto] = useState(false);
  const avatarInputRef    = useRef(null);
  const bodyPhotoInputRef = useRef(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

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
  };

  const hasPersonalData = user?.first_name || user?.last_name || user?.birth_date;

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

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al eliminar');
      await signOut({ callbackUrl: '/' });
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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff', marginBottom: '20px' }}>
              CnB<span style={{ color: '#6b6560', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', marginLeft: '4px', letterSpacing: '0.16em' }}>Choose and Buy</span>
            </div>
          </Link>
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
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              ...(user.role === 'visitor' ? [{ label: 'Mis compras', href: '/profile/orders' }] : []),
              { label: 'Notificaciones', href: '/profile/notifications' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: href === '/profile' ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none', paddingBottom: '12px',
                borderBottom: href === '/profile' ? '1.5px solid #fff' : 'none',
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px clamp(1.2rem, 4vw, 2.5rem) 48px' }}>

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
              <div style={{ maxWidth: '240px' }}>
                <label style={labelStyle}>Fecha de nacimiento</label>
                <input type="date" value={form.birth_date}
                  onChange={e => setProfileForm({ ...form, birth_date: e.target.value })}
                  style={inputStyle} />
                <p style={{ fontSize: '0.68rem', color: '#6b6560', margin: '4px 0 0' }}>
                  Usada para enviarte descuentos en tu cumpleaños
                </p>
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
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
              </button>
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
              <button onClick={() => bodyPhotoInputRef.current?.click()} disabled={uploadingBodyPhoto}
                style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: uploadingBodyPhoto ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                {uploadingBodyPhoto ? 'Subiendo...' : bodyPhotoUrl ? 'Cambiar foto' : 'Subir foto'}
              </button>
              <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: '6px 0 0' }}>
                Foto de frente, cuerpo entero. JPG, PNG o WEBP.
              </p>
              {bodyPhotoUrl && !bodyPhotoPreview && (
                <p style={{ fontSize: '0.68rem', color: '#2e7d32', margin: '4px 0 0' }}>✓ Foto guardada</p>
              )}
            </div>
          </div>
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
    </div>
  );
}
