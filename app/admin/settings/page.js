'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_TEMPLATE = 'Hola! Quiero realizar el pedido #{{order_id}}\n\nProductos:\n{{productos}}\n\nTotal: ${{total}}\n\nMis datos:\nNombre: {{nombre_cliente}}\nEmail: {{email_cliente}}\nPunto de retiro: {{punto_retiro}}';

const lbl = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6560' };
const inp = { width: '100%', padding: '9px 11px', border: '0.5px solid #e0dbd4', background: '#fafaf8', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', borderRadius: '2px', boxSizing: 'border-box', color: '#0f0f0f' };
const section = { background: '#fff', border: '0.5px solid #e0dbd4', borderRadius: '4px', padding: '28px', marginBottom: '24px' };
const h2s = { fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.2rem', margin: '0 0 20px' };

const EXAMPLE_MESSAGE_DATA = {
  order_id:       '1234',
  productos:      '2x Remera Azul - $5000\n1x Pantalón - $8000',
  total:          '18000',
  nombre_cliente: 'Juan García',
  email_cliente:  'juan@ejemplo.com',
  punto_retiro:   'Local Centro',
};

function buildPreview(template) {
  const tpl = template || DEFAULT_TEMPLATE;
  return tpl
    .replace(/\{\{order_id\}\}/g, EXAMPLE_MESSAGE_DATA.order_id)
    .replace(/\{\{productos\}\}/g, EXAMPLE_MESSAGE_DATA.productos)
    .replace(/\{\{total\}\}/g, EXAMPLE_MESSAGE_DATA.total)
    .replace(/\{\{nombre_cliente\}\}/g, EXAMPLE_MESSAGE_DATA.nombre_cliente)
    .replace(/\{\{email_cliente\}\}/g, EXAMPLE_MESSAGE_DATA.email_cliente)
    .replace(/\{\{punto_retiro\}\}/g, EXAMPLE_MESSAGE_DATA.punto_retiro);
}

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_open: i !== 0, // Domingo cerrado por defecto
  open_time: '09:00',
  close_time: '18:00',
}));

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [whatsappNumber, setWhatsappNumber]     = useState('');
  const [template,       setTemplate]           = useState(DEFAULT_TEMPLATE);
  const [address,        setAddress]            = useState('');
  const [pickupInfo,     setPickupInfo]         = useState('');
  const [hours,          setHours]              = useState(DEFAULT_HOURS);
  const [pickupPoints,   setPickupPoints]       = useState([]);
  const [newPoint,       setNewPoint]           = useState({ name: '', address: '', description: '' });
  const [addingPoint,    setAddingPoint]        = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/admin/pickup-points').then(r => r.json()).catch(() => []),
    ]).then(([data, points]) => {
      if (data.error) { setError(data.error); return; }
      setWhatsappNumber(data.whatsapp_number || '');
      setTemplate(data.whatsapp_message_template || DEFAULT_TEMPLATE);
      setAddress(data.address || '');
      setPickupInfo(data.pickup_info || '');
      if (data.hours?.length === 7) {
        setHours(data.hours.map(h => ({
          day_of_week: h.day_of_week,
          is_open:    h.is_open,
          open_time:  h.open_time ? h.open_time.slice(0, 5) : '09:00',
          close_time: h.close_time ? h.close_time.slice(0, 5) : '18:00',
        })));
      }
      setPickupPoints(Array.isArray(points) ? points : []);
    })
    .catch(() => setError('Error al cargar configuración'))
    .finally(() => setLoading(false));
  }, []);

  function updateHour(index, field, value) {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  }

  function copyFirstToAll() {
    const first = hours[1] || hours[0]; // usar Lunes como base
    setHours(prev => prev.map((h, i) => ({
      ...h,
      is_open:    i === 0 ? h.is_open : first.is_open, // Domingo no se toca
      open_time:  first.open_time,
      close_time: first.close_time,
    })));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number:            whatsappNumber.trim(),
          whatsapp_message_template:  template,
          address:                    address.trim(),
          pickup_info:                pickupInfo.trim(),
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '3rem', color: '#6b6560' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.2rem, 4vw, 2.5rem)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 8px' }}>
        Configuración
      </h1>
      <p style={{ color: '#6b6560', fontSize: '0.8rem', margin: '0 0 28px' }}>
        Contacto, WhatsApp y horarios de atención
      </p>

      {error && <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#c0392b', fontSize: '0.8rem' }}>{error}</div>}
      {success && <div style={{ background: '#e8f5e9', border: '0.5px solid #a5d6a7', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', color: '#2e7d32', fontSize: '0.8rem' }}>{success}</div>}

      <form onSubmit={handleSave}>

        {/* WhatsApp */}
        <div style={section}>
          <h2 style={h2s}>Contacto y WhatsApp</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Número de WhatsApp</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              style={inp}
              placeholder="5491112345678"
            />
            <p style={{ fontSize: '0.68rem', color: '#6b6560', margin: '5px 0 0' }}>
              Formato: código de país + número, sin espacios ni +. Ej: 5491112345678
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Template del mensaje de WhatsApp</label>
            <p style={{ fontSize: '0.68rem', color: '#6b6560', margin: '0 0 8px' }}>
              Variables: <code>{'{{order_id}}'}</code>, <code>{'{{productos}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{nombre_cliente}}'}</code>, <code>{'{{email_cliente}}'}</code>, <code>{'{{punto_retiro}}'}</code>
            </p>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={10}
              style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            <button
              type="button"
              onClick={() => setTemplate(DEFAULT_TEMPLATE)}
              style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', fontSize: '0.65rem', padding: 0, textDecoration: 'underline' }}
            >
              Restablecer template por defecto
            </button>
          </div>

          {/* Preview del mensaje */}
          <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '6px', padding: '14px 16px' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', margin: '0 0 8px' }}>
              Vista previa del mensaje (con datos de ejemplo)
            </p>
            <pre style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', margin: 0, color: '#0f0f0f', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
              {buildPreview(template)}
            </pre>
          </div>
        </div>

        {/* Dirección y retiro */}
        <div style={section}>
          <h2 style={h2s}>Dirección y retiro</h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Dirección del local</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>
          <div>
            <label style={lbl}>Información de retiro</label>
            <textarea
              value={pickupInfo}
              onChange={e => setPickupInfo(e.target.value)}
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
              placeholder="Retiro en local de Lunes a Viernes. Coordinar pago por WhatsApp."
            />
          </div>
        </div>

        {/* Horarios */}
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...h2s, margin: 0 }}>Horarios de atención</h2>
            <button
              type="button"
              onClick={copyFirstToAll}
              style={{ padding: '6px 14px', background: 'none', border: '0.5px solid #e0dbd4', cursor: 'pointer', borderRadius: '2px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560' }}
            >
              Copiar Lunes a todos
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f5f3f0' }}>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>Día</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>Abierto</th>
                  <th style={{ padding: '9px 12px', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>Apertura</th>
                  <th style={{ padding: '9px 12px', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', fontWeight: 400 }}>Cierre</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #f0ede8' }}>
                    <td style={{ padding: '10px 12px', fontWeight: h.is_open ? 500 : 400, color: h.is_open ? '#0f0f0f' : '#6b6560' }}>
                      {DAY_NAMES[h.day_of_week]}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={h.is_open}
                        onChange={e => updateHour(i, 'is_open', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input
                        type="time"
                        value={h.open_time}
                        onChange={e => updateHour(i, 'open_time', e.target.value)}
                        disabled={!h.is_open}
                        style={{ ...inp, width: 'auto', opacity: h.is_open ? 1 : 0.4 }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input
                        type="time"
                        value={h.close_time}
                        onChange={e => updateHour(i, 'close_time', e.target.value)}
                        disabled={!h.is_open}
                        style={{ ...inp, width: 'auto', opacity: h.is_open ? 1 : 0.4 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: '12px 28px', background: saving ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.78rem', borderRadius: '2px', letterSpacing: '0.08em' }}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>

      {/* Puntos de retiro */}
      <div style={section}>
        <h2 style={h2s}>Puntos de retiro</h2>
        <p style={{ margin: '-12px 0 20px', color: '#6b6560', fontSize: '0.78rem' }}>
          El comprador puede elegir dónde retirar su pedido al finalizar la compra.
        </p>

        {pickupPoints.length === 0 ? (
          <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: '20px' }}>Sin puntos de retiro configurados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {pickupPoints.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: p.active ? '#fff' : '#f5f3f0', border: '0.5px solid #e0dbd4', borderRadius: '4px' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</div>
                  {p.address && <div style={{ fontSize: '0.75rem', color: '#6b6560', marginTop: '2px' }}>{p.address}</div>}
                  {p.description && <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '2px' }}>{p.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/pickup-points/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !p.active }) });
                      setPickupPoints(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
                    }}
                    style={{ padding: '4px 10px', border: '0.5px solid #e0dbd4', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.65rem', color: '#6b6560' }}
                  >
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar este punto de retiro?')) return;
                      await fetch(`/api/admin/pickup-points/${p.id}`, { method: 'DELETE' });
                      setPickupPoints(prev => prev.filter(x => x.id !== p.id));
                    }}
                    style={{ padding: '4px 10px', border: '0.5px solid #fecaca', background: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.65rem', color: '#c0392b' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nuevo punto */}
        <div style={{ borderTop: '0.5px solid #e0dbd4', paddingTop: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6560', margin: '0 0 12px' }}>
            + Nuevo punto de retiro
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={lbl}>Nombre *</label>
              <input type="text" value={newPoint.name} onChange={e => setNewPoint(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="Ej: Local Centro, Depósito Norte" />
            </div>
            <div>
              <label style={lbl}>Dirección</label>
              <input type="text" value={newPoint.address} onChange={e => setNewPoint(p => ({ ...p, address: e.target.value }))} style={inp} placeholder="Av. Corrientes 1234" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Descripción (opcional)</label>
              <input type="text" value={newPoint.description} onChange={e => setNewPoint(p => ({ ...p, description: e.target.value }))} style={inp} placeholder="Ej: Lun a Vie de 9 a 18hs" />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!newPoint.name.trim()) return;
              setAddingPoint(true);
              try {
                const res = await fetch('/api/admin/pickup-points', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPoint) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setPickupPoints(prev => [data, ...prev]);
                setNewPoint({ name: '', address: '', description: '' });
              } catch (e) { setError(e.message); }
              finally { setAddingPoint(false); }
            }}
            disabled={addingPoint || !newPoint.name.trim()}
            style={{ padding: '9px 20px', background: addingPoint ? '#ccc' : '#0f0f0f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px', fontSize: '0.72rem' }}
          >
            {addingPoint ? 'Guardando...' : 'Agregar punto'}
          </button>
        </div>
      </div>
    </div>
  );
}
