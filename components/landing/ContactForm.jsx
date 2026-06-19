'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Por favor, completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        setError(data.error || 'Ocurrió un error inesperado. Por favor, reintenta luego.');
      }
    } catch (err) {
      setError('No se pudo enviar el formulario. Verifica tu conexión de red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-section" className="py-24 bg-[#0a0a0a] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] scroll-mt-16">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.25em] uppercase font-sans text-[#d4c5b0]/60 mb-2">
            Hablemos
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-4">
            Escribinos tu consulta
          </h2>
          <p className="text-[#d4c5b0]/70 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
            ¿Tenés dudas sobre cómo integrar el probador virtual a tu ecommerce o querés un plan a medida? Dejanos tu mensaje.
          </p>
          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mt-4" />
        </div>

        {/* Card Form */}
        <div className="bg-[#111111]/40 border border-[#2a2a2a] p-8 md:p-12 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-[#8B2635]/15 border border-[#8B2635] text-[#f5f0eb] rounded-full flex items-center justify-center text-3xl mb-6">
                  ✓
                </div>
                <h3 className="font-serif text-2xl text-[#f5f0eb] mb-3">¡Consulta enviada!</h3>
                <p className="text-[#d4c5b0]/75 text-sm max-w-md mx-auto leading-relaxed">
                  Gracias por comunicarte con CnB. Recibimos tu mensaje correctamente y te responderemos al correo provisto a la brevedad.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-8 px-6 py-3 border border-[#2a2a2a] text-xs uppercase tracking-wider text-[#d4c5b0] hover:text-[#f5f0eb] hover:border-[#8B2635] transition-all rounded-sm font-semibold"
                >
                  Enviar otro mensaje
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {error && (
                  <div className="bg-[#8B2635]/15 border border-[#8B2635]/40 text-[#f5f0eb] px-4 py-3 rounded-md text-xs font-sans tracking-wide">
                    ⚠ {error}
                  </div>
                )}

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="block text-[10px] tracking-[0.18em] uppercase font-sans text-[#d4c5b0]/70">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Sofía Pérez"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-[#8B2635] text-[#f5f0eb] text-sm px-4 py-3 rounded-sm outline-none transition-colors placeholder-[#d4c5b0]/25 font-sans"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="block text-[10px] tracking-[0.18em] uppercase font-sans text-[#d4c5b0]/70">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="Ej: sofia@empresa.com"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-[#8B2635] text-[#f5f0eb] text-sm px-4 py-3 rounded-sm outline-none transition-colors placeholder-[#d4c5b0]/25 font-sans"
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-2">
                    <label htmlFor="contact-phone" className="block text-[10px] tracking-[0.18em] uppercase font-sans text-[#d4c5b0]/70">
                      Teléfono <span className="text-[9px] text-[#d4c5b0]/40">(Opcional)</span>
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Ej: +54 9 221 555-5555"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-[#8B2635] text-[#f5f0eb] text-sm px-4 py-3 rounded-sm outline-none transition-colors placeholder-[#d4c5b0]/25 font-sans"
                    />
                  </div>

                  {/* Empresa */}
                  <div className="space-y-2">
                    <label htmlFor="contact-company" className="block text-[10px] tracking-[0.18em] uppercase font-sans text-[#d4c5b0]/70">
                      Empresa / Tienda <span className="text-[9px] text-[#d4c5b0]/40">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      id="contact-company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Ej: Zara Argentina"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-[#8B2635] text-[#f5f0eb] text-sm px-4 py-3 rounded-sm outline-none transition-colors placeholder-[#d4c5b0]/25 font-sans"
                    />
                  </div>
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label htmlFor="contact-message" className="block text-[10px] tracking-[0.18em] uppercase font-sans text-[#d4c5b0]/70">
                    Tu Consulta *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Escribinos los detalles de tu consulta aquí..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-[#8B2635] text-[#f5f0eb] text-sm px-4 py-3 rounded-sm outline-none transition-colors placeholder-[#d4c5b0]/25 font-sans resize-y"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-10 py-4 bg-[#8B2635] text-[#f5f0eb] text-xs font-bold tracking-[0.18em] uppercase rounded-sm hover:bg-[#8B2635]/85 transition-all duration-300 disabled:bg-[#8B2635]/40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#8B2635]"
                  >
                    {loading && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    )}
                    {loading ? 'Enviando...' : 'Enviar Consulta'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
