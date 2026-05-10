'use client';
import { useState, useRef } from 'react';
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
  const [toast, setToast]   = useState(null);

  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const avatarInputRef = useRef(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const user = session?.user;
  const form = profileForm || { username: user?.username || '', email: user?.email || '' };

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
      await updateSession({ username: data.username, email: data.email });
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
              FASHION<span style={{ color: '#6b6560' }}>MALL</span>
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
            </div>
          </div>

          {/* Tabs nav */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', paddingBottom: '0' }}>
            {[
              { label: 'Mi perfil', href: '/profile' },
              ...(user.role === 'visitor' ? [{ label: 'Mis compras', href: '/profile/orders' }] : []),
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

        {/* Datos personales */}
        <Section title="Datos personales">
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
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange}
                style={{ display: 'none' }} />
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                style={{ border: '0.5px solid #e0dbd4', background: 'none', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', padding: '8px 16px', fontSize: '0.72rem', borderRadius: '2px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
              </button>
              <p style={{ fontSize: '0.72rem', color: '#6b6560', margin: '6px 0 0' }}>JPG, PNG o WEBP. Máx 4 MB.</p>
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
                ¿Estás seguro? Escribí <strong>ELIMINAR</strong> para confirmar.
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
