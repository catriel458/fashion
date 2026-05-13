'use client';

import { useEffect } from 'react';

const GOOGLE_FONTS = {
  'Roboto':           'Roboto:wght@300;400;500',
  'Playfair Display': 'Playfair+Display:wght@300;400;500',
  'Montserrat':       'Montserrat:wght@300;400;500',
  'Poppins':          'Poppins:wght@300;400;500',
  'Raleway':          'Raleway:wght@300;400;500',
  'Open Sans':        'Open+Sans:wght@300;400;500',
  'Lato':             'Lato:wght@300;400;700',
  'Nunito':           'Nunito:wght@300;400;500',
  'Oswald':           'Oswald:wght@300;400;500',
};

export default function StoreThemeProvider({ store }) {
  const primary   = store?.primary_color   || '#009aae';
  const secondary = store?.secondary_color || '#ffffff';
  const font      = store?.font_family     || 'Inter';

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-primary',   primary);
    root.style.setProperty('--store-secondary', secondary);
    root.style.setProperty('--store-font',      font);

    if (font !== 'Inter' && GOOGLE_FONTS[font]) {
      const existing = document.getElementById('store-font-link');
      if (existing) existing.remove();
      const link = document.createElement('link');
      link.id   = 'store-font-link';
      link.rel  = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[font]}&display=swap`;
      document.head.appendChild(link);
    }

    return () => {
      root.style.removeProperty('--store-primary');
      root.style.removeProperty('--store-secondary');
      root.style.removeProperty('--store-font');
      document.getElementById('store-font-link')?.remove();
    };
  }, [primary, secondary, font]);

  return null;
}
