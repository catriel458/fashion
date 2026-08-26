'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] py-12 px-4 text-[#d4c5b0]/70">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Nombre / Branding */}
        <div className="flex flex-col items-center md:items-start leading-tight">
          <img src="/tnb.png" alt="TnB" className="h-8 w-auto object-contain" />
        </div>

        {/* Enlaces del Footer */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-[#d4c5b0]">
          <Link href="/stores" className="transition-colors hover:text-[#8B2635]">
            Experiencia Virtual
          </Link>
          <a href="#api-section" className="transition-colors hover:text-[#8B2635]">
            API
          </a>
          <Link href="/api-docs" className="transition-colors hover:text-[#8B2635]">
            Documentación
          </Link>
          <a href="#contact-section" className="transition-colors hover:text-[#8B2635]">
            Contacto
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#d4c5b0]/50 tracking-wide font-light">
          © 2025 TnB. Todos los derechos reservados.
        </div>

      </div>
    </footer>
  );
}
