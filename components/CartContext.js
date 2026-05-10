'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [items,     setItems]     = useState([]);
  const [isOpen,    setIsOpen]    = useState(false);

  useEffect(() => {
    let id = localStorage.getItem('fm_cart_session');
    if (!id) {
      id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('fm_cart_session', id);
    }
    setSessionId(id);
  }, []);

  const fetchCart = useCallback(async (sid) => {
    try {
      const res  = await fetch(`/api/cart?session_id=${sid}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (sessionId) fetchCart(sessionId);
  }, [sessionId, fetchCart]);

  const addItem = async (productId, qty = 1) => {
    if (!sessionId) return;
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, product_id: productId, quantity: qty }),
    });
    await fetchCart(sessionId);
  };

  const updateQuantity = async (productId, qty) => {
    if (!sessionId) return;
    await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, product_id: productId, quantity: qty }),
    });
    await fetchCart(sessionId);
  };

  const removeItem = async (productId) => {
    if (!sessionId) return;
    await fetch(`/api/cart?session_id=${sessionId}&product_id=${productId}`, {
      method: 'DELETE',
    });
    await fetchCart(sessionId);
  };

  const clearCartItems = () => setItems([]);

  const total     = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, total, itemCount, sessionId, clearCartItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
