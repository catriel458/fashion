'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OwnShoppingService() {
  const [shoppings, setShoppings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shoppings')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setShoppings(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block font-sans text-xs tracking-[0.25em] text-[#8B2635] uppercase mb-4 font-semibold">
            NUESTROS SHOPPINGS EXCLUSIVOS
          </span>
          
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-6 leading-tight">
            Shoppings Asociados
          </h2>
          
          <p className="text-[#d4c5b0]/80 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed mb-12">
            Explorá los centros comerciales que crearon sus propios espacios a medida, agrupando marcas con probadores interactivos.
          </p>

          {/* Shoppings Grid */}
          {loading ? (
            <div className="py-8 text-center text-xs tracking-widest text-[#6b6560] uppercase">Cargando centros comerciales...</div>
          ) : shoppings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-16">
              {shoppings.map(shop => (
                <div key={shop.id} className="bg-[#161616] border border-[#2a2a2a] rounded-sm p-6 flex flex-col justify-between hover:border-[#8B2635]/40 transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] tracking-wider text-[#8B2635] uppercase font-bold bg-[#8B2635]/10 px-2 py-0.5 rounded-sm">
                        {shop.store_count} marca{shop.store_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-[#f5f0eb] font-light mb-2">{shop.name}</h3>
                    <p className="text-xs text-[#d4c5b0]/65 line-clamp-2 leading-relaxed mb-6">
                      {shop.tagline || 'Explorá prendas exclusivas en nuestro shopping central.'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/shopping/${shop.slug}`} className="flex-1 text-center py-2.5 px-4 text-[10px] font-bold tracking-wider text-[#0a0a0a] bg-[#f5f0eb] hover:bg-[#8B2635] hover:text-[#f5f0eb] uppercase rounded-sm transition-all duration-200">
                      Entrar
                    </Link>
                    <Link href="/login" className="py-2.5 px-3 text-[10px] font-bold tracking-wider text-[#f5f0eb] border border-[#2a2a2a] hover:border-[#8B2635] uppercase rounded-sm transition-all duration-200">
                      Admin
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#6b6560] italic mb-16">Aún no hay shoppings independientes registrados en la plataforma.</div>
          )}

          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mb-10" />

          <p className="text-xs text-[#d4c5b0]/60 mb-6">¿Tenés un grupo de locales comerciales y querés tener tu propio portal?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <button
              onClick={scrollToContact}
              className="w-full sm:w-1/2 py-4 px-6 text-xs font-bold tracking-[0.18em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-[#8B2635]/10 hover:bg-[#8B2635] rounded-sm transition-all duration-300 shadow-lg shadow-[#8B2635]/10 hover:shadow-[#8B2635]/25 cursor-pointer"
            >
              Crear mi propio shopping
            </button>
            <Link
              href="/shopping-admin"
              className="w-full sm:w-1/2 text-center py-4 px-6 text-xs font-bold tracking-[0.18em] text-[#d4c5b0] uppercase border border-[#2a2a2a] bg-black/40 hover:text-[#f5f0eb] hover:bg-[#2a2a2a]/60 rounded-sm transition-all duration-300"
            >
              Panel Administradores
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
