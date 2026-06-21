'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function VirtualShopping() {
  const features = [
    {
      title: 'Cargá tus productos',
      description: 'Subí imágenes, definí precios, variantes de talles y colores en segundos a través de nuestro panel de control intuitivo.',
      icon: (
        <svg className="w-8 h-8 text-[#8B2635]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      title: 'Personalizá tu experiencia',
      description: 'Configurá tus colores de marca, tu logo y detalles visuales para que la experiencia refleje la identidad de tu negocio.',
      icon: (
        <svg className="w-8 h-8 text-[#8B2635]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
        </svg>
      )
    },
    {
      title: 'Recibí pagos con Mercado Pago',
      description: 'Aceptá tarjetas de crédito, débito o transferencias bancarias directamente a tu cuenta de manera segura.',
      icon: (
        <svg className="w-8 h-8 text-[#8B2635]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  const steps = [
    { number: '1', label: 'Creá tu cuenta' },
    { number: '2', label: 'Cargá tu catálogo' },
    { number: '3', label: 'Configurá pagos' },
    { number: '4', label: 'Empezá a vender' }
  ];

  return (
    <section id="shopping-section" className="py-24 bg-[#0a0a0a] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        {/* Título de la sección */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-4">
            Tu experiencia de compra online, lista en minutos
          </h2>
          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mt-4" />
        </div>

        {/* 3 Columnas de Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.8 }}
              className="p-8 rounded-xl border border-[#2a2a2a] bg-[#111111]/40 backdrop-blur-sm hover:border-[#8B2635] transition-all group"
            >
              <div className="mb-4 p-3 bg-[#8B2635]/10 rounded-lg inline-block group-hover:bg-[#8B2635]/20 transition-all">
                {feature.icon}
              </div>
              <h3 className="font-serif text-lg font-light tracking-wide text-[#f5f0eb] mb-2">{feature.title}</h3>
              <p className="text-[#d4c5b0]/70 text-sm font-light leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Paso a paso visual numerado */}
        <div className="bg-[#111111] border border-[#2a2a2a] p-8 md:p-12 rounded-2xl mb-16">
          <h3 className="font-serif text-xl md:text-2xl font-light text-[#f5f0eb] text-center mb-10">
            Un proceso simple para expandir tu marca
          </h3>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
            {/* Línea decorativa conectora */}
            <div className="absolute top-6 left-12 right-12 h-[1px] bg-[#2a2a2a] -translate-y-1/2 hidden md:block z-0" />

            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center max-w-[180px] text-center">
                <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#8B2635] text-[#f5f0eb] flex items-center justify-center font-serif font-light text-lg mb-4">
                  {step.number}
                </div>
                <span className="text-xs font-semibold tracking-wider text-[#e8ddd0] uppercase">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón CTA de la sección */}
        <div className="text-center">
          <Link href="/login?tab=register">
            <span className="inline-block py-4 px-10 text-xs font-bold tracking-[0.2em] text-[#f5f0eb] uppercase border border-[#8B2635] bg-transparent hover:bg-[#8B2635] rounded-sm transition-all duration-300 cursor-pointer">
              Crear mi experiencia de compra gratis
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
