'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const PRESET_GARMENTS = [
  {
    id: 'campera',
    name: 'Campera',
    url: 'https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607634870-campera.jpg'
  },
  {
    id: 'zapas',
    name: 'Zapatillas',
    url: 'https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607458823-zapas.PNG'
  },
  {
    id: 'boina',
    name: 'Boina',
    url: 'https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607580353-boina.jpg'
  }
];

const PRESET_PERSON = 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80';

export default function TestConsole() {
  const [apiKey] = useState('tnb_demo_xxxxxxxxxxxxxxxxxxxx');
  const [userPhoto] = useState(PRESET_PERSON);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const handleOpenLightbox = (url) => {
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setLightboxUrl(url);
  };

  const handleTestApi = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      // Si la API key es la demo, simulamos la llamada para evitar el consumo de tokens reales de OpenRouter
      if (apiKey.trim() === 'tnb_demo_xxxxxxxxxxxxxxxxxxxx') {
        // Simulamos un delay de procesamiento de IA de 1.8 segundos
        await new Promise(r => setTimeout(r, 1800));
        setResponse({
          success: true,
          resultImageUrl: '/look-5.png',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          usage: {
            requestsThisMonth: 1,
            monthlyLimit: 100,
            remaining: 99
          }
        });
      } else {
        const res = await fetch('/api/v1/fitting/try-on', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userPhoto: userPhoto.trim(),
            garments: PRESET_GARMENTS.map(g => g.url)
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
      }
    } catch (err) {
      setError({ error: 'Error de red o conexión con el servidor API.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e) => {
    if (isZoomed) {
      setIsZoomed(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin({ x, y });
      setIsZoomed(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 scroll-mt-24">
      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Panel Izquierdo: Formulario de Prueba (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#111111]/45 border border-[#2a2a2a] p-6 rounded-2xl">
          <div>
            <h3 className="font-serif text-lg font-light tracking-wide text-[#f5f0eb] mb-2">Consola de Prueba de API</h3>
            <p className="text-xs text-[#d4c5b0]/65 font-light mb-6">
              Simulá una petición HTTP POST real a nuestro probador virtual con la API Key de demostración.
            </p>

            <form onSubmit={handleTestApi} className="flex flex-col gap-4 text-left">
              {/* API Key */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0]/60 font-semibold mb-1.5">
                  Authorization Token (API Key)
                </label>
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full bg-[#111111]/70 border border-[#2a2a2a] text-[#d4c5b0]/50 text-xs font-mono p-2.5 rounded cursor-not-allowed select-all focus:outline-none"
                />
              </div>

              {/* User Photo */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0]/60 font-semibold mb-1.5">
                  User Photo (URL)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    readOnly
                    value={userPhoto}
                    className="flex-1 bg-[#111111]/70 border border-[#2a2a2a] text-[#d4c5b0]/50 text-xs font-mono p-2.5 rounded cursor-not-allowed select-all focus:outline-none"
                  />
                  <div 
                    onClick={() => handleOpenLightbox(userPhoto)}
                    className="w-10 h-10 rounded overflow-hidden border border-[#2a2a2a] bg-[#111] flex-shrink-0 cursor-pointer hover:border-[#8B2635] transition-colors"
                    title="Click para ver pantalla completa"
                  >
                    <img src={userPhoto} alt="Persona" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x100?text=Error'} />
                  </div>
                </div>
              </div>

              {/* Garments (Prendas) */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[#d4c5b0]/60 font-semibold mb-1.5">
                  Garment URLs (Prendas a probar)
                </label>
                <div className="flex flex-col gap-2">
                  {PRESET_GARMENTS.map((g, index) => (
                    <div key={g.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        readOnly
                        value={g.url}
                        className="flex-1 bg-[#111111]/70 border border-[#2a2a2a] text-[#d4c5b0]/50 text-xs font-mono p-2 rounded cursor-not-allowed select-all focus:outline-none"
                      />
                      <div 
                        onClick={() => handleOpenLightbox(g.url)}
                        className="w-9 h-9 rounded overflow-hidden border border-[#2a2a2a] bg-[#111] flex-shrink-0 cursor-pointer hover:border-[#8B2635] transition-colors"
                        title="Click para ver pantalla completa"
                      >
                        <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="mt-4 p-3 bg-[#111111] border border-[#2a2a2a] rounded flex gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div 
                        onClick={() => handleOpenLightbox(response.resultImageUrl)}
                        className="w-12 h-16 bg-[#0a0a0a] flex-shrink-0 rounded overflow-hidden border border-[#2a2a2a] flex items-center justify-center text-[10px] cursor-pointer hover:border-[#8B2635] transition-colors"
                        title="Click para ver pantalla completa"
                      >
                        <img src={response.resultImageUrl} alt="Resultado" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] leading-snug">
                        <span className="text-[#f5f0eb] font-medium block">¡Vestidor IA Simulado con Éxito!</span>
                        <span className="text-[#d4c5b0]/55 block">Click en miniatura para expandir.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenLightbox(response.resultImageUrl)}
                        className="px-2.5 py-1.5 border border-[#2a2a2a] text-[#d4c5b0] hover:text-[#f5f0eb] hover:border-[#8B2635] text-[10px] uppercase font-bold tracking-wider rounded transition-colors"
                        title="Ver en pantalla completa"
                      >
                        Ampliar
                      </button>
                      <a
                        href={response.resultImageUrl}
                        download="look-5.png"
                        className="px-2.5 py-1.5 bg-[#8B2635] hover:bg-[#8B2635]/80 text-white text-[10px] uppercase font-bold tracking-wider rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title="Descargar resultado"
                      >
                        Descargar
                      </a>
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
                    <span className="text-[#8B2635]">fetch</span>(<span className="text-[#e8ddd0]">"https://api.tnb.com/v1/fitting/try-on"</span>, &#123;{'\n'}
                    {'  '}method: <span className="text-[#e8ddd0]">"POST"</span>,{'\n'}
                    {'  '}headers: &#123;{'\n'}
                    {'    '}<span className="text-[#d4c5b0]">"Authorization"</span>: <span className="text-[#e8ddd0]">"Bearer {apiKey || 'tnb_demo_xxxxxxxxxx'}"</span>,{'\n'}
                    {'    '}<span className="text-[#d4c5b0]">"Content-Type"</span>: <span className="text-[#e8ddd0]">"application/json"</span>{'\n'}
                    {'  '}&#125;,{'\n'}
                    {'  '}body: JSON.<span className="text-[#8B2635]">stringify</span>(&#123;{'\n'}
                    {'    '}<span className="text-[#d4c5b0]">userPhoto</span>: <span className="text-[#e8ddd0]">"{userPhoto}"</span>,{'\n'}
                    {'    '}<span className="text-[#d4c5b0]">garments</span>: [{'\n'}
                    {'      '}<span className="text-[#e8ddd0]">"https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607634870-campera.jpg"</span>,{'\n'}
                    {'      '}<span className="text-[#e8ddd0]">"https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607458823-zapas.PNG"</span>,{'\n'}
                    {'      '}<span className="text-[#e8ddd0]">"https://aiq7mraevuhfwffd.public.blob.vercel-storage.com/products/1778607580353-boina.jpg"</span>{'\n'}
                    {'    '}]{'\n'}
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

      {/* Lightbox / Modal de Pantalla Completa */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Contenedor de la Imagen con zoom interactivo */}
              <div className="relative overflow-hidden border border-[#2a2a2a] rounded-lg bg-[#050505]/95 shadow-2xl flex items-center justify-center max-w-full max-h-[70vh]">
                <img 
                  src={lightboxUrl} 
                  alt="Vista previa completa" 
                  onClick={handleImageClick}
                  style={{
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                  className={`max-w-full max-h-[65vh] object-contain rounded-lg transition-transform ${
                    isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  }`} 
                />
              </div>
              
              {/* Controles del lightbox inferiores */}
              <div className="flex items-center gap-4">
                <a
                  href={lightboxUrl}
                  download={lightboxUrl.substring(lightboxUrl.lastIndexOf('/') + 1) || 'imagen.png'}
                  className="py-2 px-6 bg-[#8B2635] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#8B2635]/80 transition-colors cursor-pointer"
                >
                  Descargar Imagen
                </a>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="py-2 px-6 border border-[#2a2a2a] text-[#d4c5b0] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#111] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
