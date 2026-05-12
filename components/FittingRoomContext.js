'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const FittingRoomContext = createContext(null);
const STORAGE_KEY = 'fitting_room';

export const VALID_CATEGORIES = ['remera', 'pantalon', 'abrigo', 'camisa', 'zapatillas', 'gorro', 'accesorio'];

export const CATEGORY_MAP = {
  remeras:    'remera',
  pantalones: 'pantalon',
  abrigos:    'abrigo',
  camisas:    'camisa',
  zapatillas: 'zapatillas',
  gorros:     'gorro',
  accesorios: 'accesorio',
};

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
