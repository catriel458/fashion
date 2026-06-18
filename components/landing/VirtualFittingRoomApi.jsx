'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function VirtualFittingRoomApi() {
  const [apiKey, setApiKey] = useState('cnb_demo_xxxxxxxxxxxxxxxxxxxx');
  const [userPhoto, setUserPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [garmentUrl, setGarmentUrl] = useState('https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleTestApi = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const res = await fetch('/api/v1/fitting/try-on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userPhoto: userPhoto.trim(),
          garments: [garmentUrl.trim()]
        })
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;

      // Retardo artificial mínimo para mejorar UX de carga
      await new Promise(r => setTimeout(r, Math.max(0, 800 - elapsed)));

      if (!res.ok) {
        setError(data);
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError({ error: 'Error de red o conexión con el servidor API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="api-section" className="py-24 bg-[#0a0a0a] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-4">
            Integrá el probador virtual en tu e-commerce
          </h2>
          <p className="text-[#d4c5b0]/80 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Hacé llamados directos a nuestra API REST enviando la foto de tus clientes y tus prendas. La IA procesa y genera la imagen vestida de inmediato.
          </p>
          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mt-4" />
        </div>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Panel Izquierdo: Formulario de Prueba Interactiva (5 columnas) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#111111]/45 border border-[#2a2a2a] p-6 rounded-2xl">
            <div>
              <h3 className="font-serif text-lg font-light tracking-wide text-[#f5f0eb] mb-2">Consola de Prueba</h3>
              <p className="text-xs text-[#d4c5b0]/65 font-light mb-6">
                Modificá las variables de abajo para simular una petición HTTP POST real a nuestro probador virtual.
              </p>

              <form onSubmit={handleTestApi} className="flex flex-col gap-4 text-left">
                {/* API Key */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0] font-medium mb-1.5">
                    Authorization Token (API Key)
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f5f0eb] text-xs font-mono p-2.5 rounded focus:outline-none focus:border-[#8B2635] transition-colors"
                  />
                </div>

                {/* User Photo */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0] font-medium mb-1.5">
                    User Photo (URL o Base64)
                  </label>
                  <input
                    type="text"
                    required
                    value={userPhoto}
                    onChange={(e) => setUserPhoto(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f5f0eb] text-xs font-mono p-2.5 rounded focus:outline-none focus:border-[#8B2635] transition-colors"
                  />
                </div>

                {/* Garments (array de 1) */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0] font-medium mb-1.5">
                    Garment URL (Prenda a probar)
                  </label>
                  <input
                    type="text"
                    required
                    value={garmentUrl}
                    onChange={(e) => setGarmentUrl(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f5f0eb] text-xs font-mono p-2.5 rounded focus:outline-none focus:border-[#8B2635] transition-colors"
                  />
                </div>

                {/* Botón Probar API */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 border border-[#8B2635] bg-transparent text-[#f5f0eb] text-xs font-bold uppercase tracking-[0.15em] rounded-sm hover:bg-[#8B2635] transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Enviando Petición...' : 'Probar API'}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-[#2a2a2a] flex flex-col gap-3">
              <span className="text-xs text-[#d4c5b0]/70 font-light">
                ¿Querés ver una guía completa sobre cómo estructurar la API en tu backend?
              </span>
              <Link href="/api-docs">
                <span className="inline-block py-2.5 px-4 text-xs text-center font-bold tracking-[0.15em] text-[#d4c5b0] border border-[#2a2a2a] rounded-sm hover:text-[#f5f0eb] hover:border-[#8B2635] hover:bg-[#8B2635]/15 transition-colors cursor-pointer">
                  Manual de la API
                </span>
              </Link>
            </div>
          </div>

          {/* Panel Derecho: Visualizador de Terminal de Código (7 columnas) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#050505] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            
            {/* Cabecera de consola */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#2a2a2a] select-none">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a] border border-[#8B2635]/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
              </div>
              <span className="text-xs font-mono text-[#d4c5b0]/40">tryon-rest-client.sh</span>
              <div className="w-10" />
            </div>

            {/* Contenedor del Editor de Código o de Respuesta */}
            <div className="flex-1 p-6 font-mono text-xs md:text-sm overflow-x-auto text-left leading-relaxed min-h-[300px] select-all">
              <AnimatePresence mode="wait">
                
                {/* 1. Estado de Carga */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[#d4c5b0] flex flex-col gap-2 h-full justify-center items-center py-12"
                  >
                    <div className="flex items-center gap-2 font-light">
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Enviando POST request a /api/v1/fitting/try-on...</span>
                    </div>
                    <span className="text-[10px] text-[#d4c5b0]/40">Analizando credenciales y procesando prendas con IA...</span>
                  </motion.div>
                )}

                {/* 2. Respuesta de Éxito */}
                {!loading && response && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[#e8ddd0]"
                  >
                    <span className="text-[#d4c5b0] font-bold block mb-2">// HTTP/1.1 200 OK</span>
                    <pre className="text-[#e8ddd0] font-mono text-[11px] md:text-xs">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                    <div className="mt-4 p-3 bg-[#111111] border border-[#2a2a2a] rounded flex gap-3 items-center">
                      <div className="w-12 h-16 bg-[#0a0a0a] flex-shrink-0 rounded overflow-hidden flex items-center justify-center text-[10px]">
                        <img src={response.resultImageUrl} alt="Resultado" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] leading-snug">
                        <span className="text-[#f5f0eb] font-medium block">¡Vestidor IA Simulado con Éxito!</span>
                        <span className="text-[#d4c5b0]/55 block">La URL de la imagen en resultImageUrl expira en 1 hora.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. Respuesta de Error */}
                {!loading && error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[#8B2635]"
                  >
                    <span className="text-[#8B2635] font-bold block mb-2">// HTTP/1.1 {error.resetDate ? '429 Too Many Requests' : '400 Bad Request'}</span>
                    <pre className="text-[#e8ddd0] font-mono text-[11px] md:text-xs">
                      {JSON.stringify(error, null, 2)}
                    </pre>
                  </motion.div>
                )}

                {/* 4. Estado Inicial: Código fuente */}
                {!loading && !response && !error && (
                  <motion.pre
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[#e8ddd0]/90"
                  >
                    <code>
                      <span className="text-[#8B2635]">fetch</span>(<span className="text-[#e8ddd0]">"https://api.cnb.com/v1/fitting/try-on"</span>, &#123;{'\n'}
                      {'  '}method: <span className="text-[#e8ddd0]">"POST"</span>,{'\n'}
                      {'  '}headers: &#123;{'\n'}
                      {'    '}<span className="text-[#d4c5b0]">"Authorization"</span>: <span className="text-[#e8ddd0]">"Bearer {apiKey || 'cnb_demo_xxxxxxxxxx'}"</span>,{'\n'}
                      {'    '}<span className="text-[#d4c5b0]">"Content-Type"</span>: <span className="text-[#e8ddd0]">"application/json"</span>{'\n'}
                      {'  '}&#125;,{'\n'}
                      {'  '}body: JSON.<span className="text-[#8B2635]">stringify</span>(&#123;{'\n'}
                      {'    '}<span className="text-[#d4c5b0]">userPhoto</span>: <span className="text-[#e8ddd0]">"{userPhoto.length > 50 ? userPhoto.substring(0, 47) + '...' : userPhoto}"</span>,{'\n'}
                      {'    '}<span className="text-[#d4c5b0]">garments</span>: [<span className="text-[#e8ddd0]">"{garmentUrl.length > 50 ? garmentUrl.substring(0, 47) + '...' : garmentUrl}"</span>]{'\n'}
                      {'  '}&#125;){'\n'}
                      &#125;)
                    </code>
                  </motion.pre>
                )}

              </AnimatePresence>
            </div>

            {/* Pie de Consola */}
            <div className="px-4 py-3 bg-[#111111] text-[#d4c5b0]/40 font-mono text-[10px] text-right border-t border-[#2a2a2a]">
              Presioná "Probar API" a la izquierda para ejecutar.
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
