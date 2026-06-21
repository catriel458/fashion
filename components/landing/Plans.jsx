'use client';
import { motion } from 'framer-motion';

export default function Plans() {
  const plans = [
    {
      name: 'Plan Starter',
      price: '$19',
      period: '/ mes',
      features: [
        '100 requests / mes',
        '1 API Key',
        'Soporte por email'
      ],
      isPopular: false,
      ctaText: 'Elegir plan'
    },
    {
      name: 'Plan Growth',
      price: '$49',
      period: '/ mes',
      features: [
        '300 requests / mes',
        '2 API Keys',
        'Soporte prioritario'
      ],
      isPopular: false,
      ctaText: 'Elegir plan'
    },
    {
      name: 'Plan Pro',
      price: '$99',
      period: '/ mes',
      features: [
        '800 requests / mes',
        '5 API Keys',
        'Soporte 24/7'
      ],
      isPopular: true,
      ctaText: 'Elegir plan'
    },
    {
      name: 'Plan Scale',
      price: '$249',
      period: '/ mes',
      features: [
        '2.000 requests / mes',
        'API Keys ilimitadas',
        'Integración dedicada'
      ],
      isPopular: false,
      ctaText: 'Elegir plan'
    }
  ];

  return (
    <section id="plans-section" className="py-24 bg-[#0a0a0a] text-[#e8ddd0] px-4 border-t border-[#2a2a2a] scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Título de la sección */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-[#f5f0eb] mb-4">
            Planes de API adaptados a tu escala
          </h2>
          <p className="text-[#d4c5b0]/70 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Elegí la potencia del probador virtual según la escala de tu experiencia de compra.
          </p>
          <div className="h-[1px] w-20 bg-[#8B2635] mx-auto mt-4" />
        </div>

        {/* Cartas de Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.8 }}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 ${
                plan.isPopular 
                  ? 'border-[#8B2635] bg-[#111111] md:-translate-y-2' 
                  : 'border-[#2a2a2a] bg-[#111111]/30 hover:border-[#8B2635]/60'
              }`}
            >
              {/* Badge destacado de plan popular */}
              {plan.isPopular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#8B2635] text-[#f5f0eb] px-4 py-1 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm">
                  Más elegido
                </div>
              )}

              {/* Nombre y Precio */}
              <div>
                <h3 className="font-serif text-xl font-medium text-[#f5f0eb] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-4xl md:text-5xl font-extrabold text-[#f5f0eb] tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-[#d4c5b0]/60 text-sm">{plan.period}</span>}
                </div>
                
                <div className="h-[1px] bg-[#2a2a2a] my-6" />

                {/* Características del plan */}
                <ul className="flex flex-col gap-3 text-[#e8ddd0]/85 text-sm mb-8 font-light">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-[#8B2635] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Botón */}
              <button
                className={`w-full py-4 px-6 text-xs font-bold tracking-[0.15em] uppercase rounded-sm transition-all duration-300 ${
                  plan.isPopular
                    ? 'border border-[#8B2635] bg-transparent text-[#f5f0eb] hover:bg-[#8B2635]'
                    : 'border border-[#2a2a2a] bg-transparent text-[#d4c5b0] hover:text-[#f5f0eb] hover:border-[#8B2635] hover:bg-[#8B2635]/15'
                }`}
              >
                {plan.ctaText}
              </button>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
