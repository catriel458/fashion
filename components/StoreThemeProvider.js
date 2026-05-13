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

function loadGoogleFont(font, linkId) {
  if (!font || font === 'Inter' || !GOOGLE_FONTS[font]) return;
  const existing = document.getElementById(linkId);
  if (existing && existing.dataset.font === font) return;
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.id           = linkId;
  link.rel          = 'stylesheet';
  link.dataset.font = font;
  link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[font]}&display=swap`;
  document.head.appendChild(link);
}

export default function StoreThemeProvider({ store }) {
  const primary          = store?.primary_color      || '#009aae';
  const secondary        = store?.secondary_color    || '#ffffff';
  const font             = store?.font_family        || 'Inter';
  const headerColor      = store?.header_color       || null;
  const footerColor      = store?.footer_color       || null;
  const panelBgColor     = store?.panel_bg_color     || null;
  const panelTextColor   = store?.panel_text_color   || null;
  const headerFont       = store?.header_font        || null;
  const headerFontSize   = store?.header_font_size   || null;
  const headerTextColor  = store?.header_text_color  || null;
  const footerFont       = store?.footer_font        || null;
  const footerFontSize   = store?.footer_font_size   || null;
  const footerTextColor  = store?.footer_text_color  || null;

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--store-primary',   primary);
    root.style.setProperty('--store-secondary', secondary);
    root.style.setProperty('--store-font',      font);

    const setOrRemove = (varName, value) =>
      value ? root.style.setProperty(varName, value) : root.style.removeProperty(varName);

    setOrRemove('--store-header-color',      headerColor);
    setOrRemove('--store-footer-color',      footerColor);
    setOrRemove('--store-panel-bg',          panelBgColor);
    setOrRemove('--store-panel-text',        panelTextColor);
    setOrRemove('--store-header-font',       headerFont);
    setOrRemove('--store-header-font-size',  headerFontSize);
    setOrRemove('--store-header-text-color', headerTextColor);
    setOrRemove('--store-footer-font',       footerFont);
    setOrRemove('--store-footer-font-size',  footerFontSize);
    setOrRemove('--store-footer-text-color', footerTextColor);

    loadGoogleFont(font,       'store-font-link');
    loadGoogleFont(headerFont, 'store-header-font-link');
    loadGoogleFont(footerFont, 'store-footer-font-link');

    return () => {
      [
        '--store-primary', '--store-secondary', '--store-font',
        '--store-header-color', '--store-footer-color',
        '--store-panel-bg', '--store-panel-text',
        '--store-header-font', '--store-header-font-size', '--store-header-text-color',
        '--store-footer-font', '--store-footer-font-size', '--store-footer-text-color',
      ].forEach(v => root.style.removeProperty(v));
      ['store-font-link', 'store-header-font-link', 'store-footer-font-link']
        .forEach(id => document.getElementById(id)?.remove());
    };
  }, [primary, secondary, font, headerColor, footerColor, panelBgColor, panelTextColor,
      headerFont, headerFontSize, headerTextColor,
      footerFont, footerFontSize, footerTextColor]);

  return null;
}
