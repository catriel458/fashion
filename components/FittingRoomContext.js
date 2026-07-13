'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const FittingRoomContext = createContext(null);
const STORAGE_KEY = 'fitting_room';

export const VALID_CATEGORIES = ['remera', 'pantalon', 'abrigo', 'camisa', 'zapatillas', 'gorro', 'accesorio'];

export const CATEGORY_MAP = {
  remeras:            'remera',
  pantalones:         'pantalon',
  abrigos:            'abrigo',
  camisas:            'camisa',
  zapatillas:         'zapatillas',
  gorros:             'gorro',
  accesorios:         'accesorio',
  // Variantes para otras tiendas del sistema
  'hoodies-buzos':    'abrigo',
  'camperas':         'abrigo',
  'pantalones-jeans': 'pantalon',
  'shorts':           'pantalon',
  'buzos':            'abrigo',
};

export function getFittingCategory(slug = '', name = '') {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (CATEGORY_MAP[s]) return CATEGORY_MAP[s];

  if (s.includes('remera') || n.includes('remera') || 
      s.includes('top') || n.includes('top') || 
      s.includes('musculosa') || n.includes('musculosa') || 
      s.includes('body') || n.includes('body') || 
      s.includes('remeras') || n.includes('remeras')) {
    return 'remera';
  }

  if (s.includes('camisa') || n.includes('camisa') || 
      s.includes('blusa') || n.includes('blusa') || 
      s.includes('camisas') || n.includes('camisas')) {
    return 'camisa';
  }

  if (s.includes('abrigo') || n.includes('abrigo') || 
      s.includes('buzo') || n.includes('buzo') || 
      s.includes('hoodie') || n.includes('hoodie') || 
      s.includes('campera') || n.includes('campera') || 
      s.includes('saco') || n.includes('saco') || 
      s.includes('sweater') || n.includes('sweater') || 
      s.includes('cardigan') || n.includes('cardigan') || 
      s.includes('chaleco') || n.includes('chaleco') || 
      s.includes('jacket') || n.includes('jacket') ||
      s.includes('abrigos') || n.includes('abrigos') ||
      s.includes('camperas') || n.includes('camperas') ||
      s.includes('buzos') || n.includes('buzos') ||
      s.includes('hoodies') || n.includes('hoodies')) {
    return 'abrigo';
  }

  if (s.includes('pantalon') || n.includes('pantalon') || 
      s.includes('jean') || n.includes('jean') || 
      s.includes('calza') || n.includes('calza') || 
      s.includes('bermuda') || n.includes('bermuda') || 
      s.includes('short') || n.includes('short') || 
      s.includes('pollera') || n.includes('pollera') || 
      s.includes('pantalones') || n.includes('pantalones') ||
      s.includes('jeans') || n.includes('jeans') ||
      s.includes('shorts') || n.includes('shorts') ||
      s.includes('polleras') || n.includes('polleras')) {
    return 'pantalon';
  }

  if (s.includes('zapatilla') || n.includes('zapatilla') || 
      s.includes('zapato') || n.includes('zapato') || 
      s.includes('bota') || n.includes('bota') || 
      s.includes('sandalia') || n.includes('sandalia') || 
      s.includes('sneaker') || n.includes('sneaker') ||
      s.includes('zapatillas') || n.includes('zapatillas') ||
      s.includes('zapatos') || n.includes('zapatos') ||
      s.includes('botas') || n.includes('botas') ||
      s.includes('sandalias') || n.includes('sandalias')) {
    return 'zapatillas';
  }

  if (s.includes('gorro') || n.includes('gorro') || 
      s.includes('cap') || n.includes('cap') || 
      s.includes('hat') || n.includes('hat') || 
      s.includes('boina') || n.includes('boina') || 
      s.includes('piluso') || n.includes('piluso') ||
      s.includes('gorros') || n.includes('gorros')) {
    return 'gorro';
  }

  if (s.includes('accesorio') || n.includes('accesorio') || 
      s.includes('collar') || n.includes('collar') || 
      s.includes('pulsera') || n.includes('pulsera') || 
      s.includes('cartera') || n.includes('cartera') || 
      s.includes('bolso') || n.includes('bolso') || 
      s.includes('lentes') || n.includes('lentes') || 
      s.includes('gafas') || n.includes('gafas') ||
      s.includes('accesorios') || n.includes('accesorios')) {
    return 'accesorio';
  }

  return s;
}

export function FittingRoomProvider({ children }) {
  const [items, setItems]           = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (newItems) => {
    setItems(newItems);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)); } catch {}
  };

  const addToFittingRoom = (product) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.category !== product.category);
      const newItems = [...filtered, product];
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)); } catch {}
      return newItems;
    });
  };

  const removeFromFittingRoom = (id) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)); } catch {}
      return newItems;
    });
  };

  const clearFittingRoom = () => {
    setItems([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <FittingRoomContext.Provider value={{
      items, isPanelOpen, setIsPanelOpen,
      addToFittingRoom, removeFromFittingRoom, clearFittingRoom,
    }}>
      {children}
    </FittingRoomContext.Provider>
  );
}

export function useFittingRoom() {
  const ctx = useContext(FittingRoomContext);
  if (!ctx) throw new Error('useFittingRoom debe usarse dentro de FittingRoomProvider');
  return ctx;
}
