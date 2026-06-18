'use client';
import Hero from '@/components/landing/Hero';
import VirtualShopping from '@/components/landing/VirtualShopping';
import VirtualFittingRoomApi from '@/components/landing/VirtualFittingRoomApi';
import Plans from '@/components/landing/Plans';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8ddd0] font-sans antialiased selection:bg-[#8B2635]/30 selection:text-white">
      {/* 1. Hero principal */}
      <Hero />

      {/* 2. Sección Shopping Virtual */}
      <VirtualShopping />

      {/* 4. Sección API del Probador Virtual */}
      <VirtualFittingRoomApi />

      {/* 5. Sección de Planes */}
      <Plans />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
