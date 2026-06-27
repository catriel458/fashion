'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CtaBanner() {
  return (
    <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden">
      {/* Parallax Background Image with Unsplash URL */}
      <div 
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1920&q=80')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
        className="absolute inset-0 bg-scroll md:bg-fixed z-0 scale-105"
      />

      {/* Dark overlay: bg-black/70 with blur backdrop-blur-[2px] */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-10" />

      {/* Content wrapper */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block font-sans text-xs tracking-[0.25em] text-[#d4c5b0] uppercase mb-4">
            LLEVÁ TU TIENDA AL SIGUIENTE NIVEL
          </span>
          
          <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-wide text-[#f5f0eb] mb-6 leading-tight">
            ¿Listo para integrar el Vestidor Inteligente?
          </h2>
          
          <p className="font-sans text-sm md:text-base text-[#e8ddd0]/80 font-light leading-relaxed max-w-xl mx-auto mb-10">
            Únete a las marcas líderes que ya están transformando sus tiendas físicas y digitales con nuestra tecnología de IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/stores">
              <span className="w-52 text-center py-3.5 px-6 text-xs font-bold tracking-[0.18em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-black/40 backdrop-blur-sm hover:bg-black/70 rounded-sm transition-all duration-300 cursor-pointer">
                Ver Experiencias
              </span>
            </Link>

            <Link href="/api-docs">
              <span className="w-52 text-center py-3.5 px-6 text-xs font-bold tracking-[0.18em] text-[#d4c5b0] uppercase border border-[#2a2a2a] bg-black/40 backdrop-blur-sm hover:text-[#f5f0eb] hover:bg-black/70 rounded-sm transition-all duration-300 cursor-pointer">
                Documentación API
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
