'use client';
import { motion } from 'framer-motion';

const BLOCKS = [
  {
    num: '01',
    label: 'MISIÓN',
    title: 'Nuestra razón de ser',
    text: 'Proveer una solución tecnológica basada en IA que transforme la experiencia de compra y venta en la industria textil, creando interacciones más humanas, realistas y satisfactorias entre compradores y vendedores a través de procesos ágiles, personalizados y transparentes.'
  },
  {
    num: '02',
    label: 'VISIÓN',
    title: 'Hacia dónde vamos',
    text: 'Impulsar una nueva forma de interacción comercial en la industria textil a través de soluciones basadas en inteligencia artificial, transformando los modelos estandarizados tradicionales en experiencias más humanas, interactivas, transparentes y atractivas, que fomenten la confianza y la fidelización entre compradores y vendedores.'
  },
  {
    num: '03',
    label: 'VALORES',
    title: 'Lo que nos guía',
    items: [
      'Innovación Permanente',
      'Responsabilidad Social',
      'Ética'
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
    }
  }
};

export default function Institucional() {
  return (
    <section id="institucional-section" className="relative bg-[#0a0a0a] text-[#e8ddd0] py-24 px-6 md:px-12 border-t border-[#1f1f1f] overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B2635]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Heading Info */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <span className="block font-sans text-xs tracking-[0.2em] text-[#d4c5b0] uppercase mb-3">
              NUESTRO PROPÓSITO
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-[#f5f0eb] mb-6 leading-tight">
              Diseñando el futuro del retail de moda.
            </h2>
            <div className="w-12 h-[1px] bg-[#8B2635] mb-6" />
            <p className="font-sans text-sm md:text-base text-[#d4c5b0]/80 font-light leading-relaxed max-w-md">
              Cada persona es distinta. TnB usa inteligencia artificial para que cada comprador encuentre lo que le queda bien, desde cualquier dispositivo, en cualquier tienda
            </p>
          </div>

          {/* Right Column: Three blocks */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-7 flex flex-col gap-12"
          >
            {BLOCKS.map((block, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="relative group border-b border-[#2a2a2a] pb-10 last:border-0"
              >
                {/* Giant low-contrast number behind content */}
                <span className="absolute -top-6 left-0 font-serif text-8xl md:text-9xl font-bold text-[#d4c5b0]/5 select-none pointer-events-none transition-all duration-500 group-hover:text-[#8B2635]/10 group-hover:-translate-y-2">
                  {block.num}
                </span>

                {/* Content Block */}
                <div className="relative z-10 pl-4 md:pl-8 border-l border-[#8B2635]/30 group-hover:border-[#8B2635] transition-colors duration-300">
                  <span className="block font-sans text-[10px] tracking-[0.2em] text-[#d4c5b0]/70 uppercase mb-1">
                    {block.label}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl font-light tracking-wide text-[#f5f0eb] mb-4 group-hover:text-[#d4c5b0] transition-colors duration-300">
                    {block.title}
                  </h3>
                  {block.text && (
                    <p className="font-sans text-xs md:text-sm text-[#d4c5b0]/70 font-light leading-relaxed max-w-2xl">
                      {block.text}
                    </p>
                  )}
                  {block.items && (
                    <ul className="space-y-2.5 pl-0">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs md:text-sm text-[#d4c5b0]/70 font-light">
                          <span className="w-1.5 h-1.5 bg-[#8B2635] rounded-full" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
