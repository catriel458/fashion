'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const BACKDROP_GIFS = [
  '/gifs/lp1.gif',
  '/gifs/lp2.gif',
  '/gifs/lp3.gif'
];

export default function Hero() {
  const [currentGif, setCurrentGif] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGif(prev => (prev + 1) % BACKDROP_GIFS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-[#0a0a0a]">

      {/* Carrusel dinámico de GIFs de fondo con desvanecimiento cruzado */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {BACKDROP_GIFS.map((gif, idx) => (
          <div
            key={idx}
            style={{
              backgroundImage: `url(${gif})`,
              opacity: idx === currentGif ? 1.0 : 0,
              transition: 'opacity 2.0s ease-in-out',
            }}
            className="absolute inset-0 bg-cover bg-center scale-102"
          />
        ))}

        {/* Único overlay de oscurecimiento con opacidad de 0.45 */}
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="z-10 max-w-5xl"
      >
        {/* Etiqueta superior */}
        <span
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
          className="block font-sans text-xs tracking-[0.28em] text-[#d4c5b0] uppercase mb-4"
        >
          CHOOSE AND BUY
        </span>

        {/* Título Principal */}
        <h1 
          style={{ textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}
          className="font-serif text-6xl sm:text-8xl md:text-9xl font-light tracking-wide text-[#f5f0eb] select-none mb-8"
        >
          CnB
        </h1>

        {/* Leyenda y Tagline Premium */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
          className="font-sans text-base md:text-xl text-[#e8ddd0] font-light tracking-wide max-w-3xl mx-auto mb-16 leading-relaxed"
        >
          Vendé y probá en nuestro shopping. O llevá el probador a tu tienda.
        </motion.p>

        {/* Botones de Acción */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1.0 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <Link href="/stores">
            <span className="w-56 text-center py-4 px-8 text-xs font-bold tracking-[0.2em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-black/40 backdrop-blur-sm hover:bg-black/70 rounded-sm transition-all duration-300 cursor-pointer">
              Abrir mi tienda
            </span>
          </Link>

          <a href="#api-section">
            <span className="w-56 text-center py-4 px-8 text-xs font-bold tracking-[0.2em] text-[#d4c5b0] uppercase border border-[#2a2a2a] bg-black/40 backdrop-blur-sm hover:text-[#f5f0eb] hover:bg-black/70 rounded-sm transition-all duration-300 cursor-pointer">
              Ver la API
            </span>
          </a>
        </motion.div>
      </motion.div>

      {/* Flecha de desplazamiento */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 cursor-pointer z-10"
      >
        <a href="#shopping-section">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}
