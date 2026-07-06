'use client';
import { motion } from 'framer-motion';

export default function OwnShoppingService() {
  const scrollToContact = (e) => {
    e.preventDefault();
    const contactSec = document.getElementById('contact-section');
    if (contactSec) {
      contactSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-[#111111] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#8B2635]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-[#8b2635]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block font-sans text-xs tracking-[0.25em] text-[#8B2635] uppercase mb-4 font-semibold">
            SERVICIOS A MEDIDA
          </span>
          
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-6 leading-tight">
            ¿Querés crear tu propio shopping virtual?
          </h2>
          
          <p className="text-[#d4c5b0]/80 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Diseñamos e implementamos plataformas multi-marca personalizadas. Si tenés un grupo de comercios, una galería comercial o una red de tiendas y querés unificar la experiencia con vestidores virtuales interactivos e integración inteligente con IA, desarrollamos tu propio shopping a pedido.
          </p>

          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mb-10" />

          <button
            onClick={scrollToContact}
            className="inline-block py-4 px-10 text-xs font-bold tracking-[0.18em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-[#8B2635]/10 hover:bg-[#8B2635] rounded-sm transition-all duration-300 shadow-lg shadow-[#8B2635]/10 hover:shadow-[#8B2635]/25 cursor-pointer"
          >
            Ponete en contacto con nosotros
          </button>
        </motion.div>
      </div>
    </section>
  );
}
