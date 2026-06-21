'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function VirtualFittingRoomApi() {
  return (
    <section id="api-section" className="py-32 bg-[#0a0a0a] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] relative overflow-hidden">
      
      {/* Luces decorativas de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B2635]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Tagline Premium */}
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="block font-sans text-xs tracking-[0.25em] text-[#8B2635] uppercase mb-4 font-semibold"
        >
          API de Probador Virtual
        </motion.span>

        {/* Título Principal */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-6 leading-tight"
        >
          Transformá tu forma de comprar en línea
        </motion.h2>

        {/* Separador elegante */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="h-[1px] w-20 bg-[#8B2635] mx-auto mb-10 origin-center"
        />

        {/* Descripción de la API */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="text-[#d4c5b0]/85 text-sm md:text-lg max-w-3xl mx-auto font-light leading-relaxed mb-12"
        >
          CnB pone a tu disposición una API de vestidor virtual de última tecnología, especializada y refinada para esta tarea. 
          Al enviarnos imágenes de tu catálogo y la foto de tus clientes, la IA procesa y genera la imagen del usuario vistiendo las prendas de inmediato. 
          Es la solución ideal para que tus clientes descubran cómo les quedan las prendas sin tener que ir a probárselas, optimizando las conversiones y redefiniendo la experiencia de compra.
        </motion.p>

        {/* Botón Saber Más */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link href="/api-docs">
            <span className="inline-block py-4 px-10 text-xs font-bold tracking-[0.2em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-[#8B2635]/10 hover:bg-[#8B2635] rounded-sm transition-all duration-300 cursor-pointer shadow-lg shadow-[#8B2635]/5">
              Saber más & probar API
            </span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
