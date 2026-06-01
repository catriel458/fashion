'use client';

import { useEffect, useRef } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

const USER_ICON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36'%3E%3Cellipse cx='12' cy='34' rx='5' ry='2' fill='rgba(0,0,0,0.2)'/%3E%3Cpath d='M12 0C7.6 0 4 3.6 4 8c0 6 8 20 8 20s8-14 8-20c0-4.4-3.6-8-8-8z' fill='%23c0392b'/%3E%3Ccircle cx='12' cy='8' r='3.5' fill='white'/%3E%3C/svg%3E`;

export default function MapWithRadius({ storeLat, storeLng, radiusKm = 5, userLat, userLng, height = 220 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !storeLat || !storeLng) return;

    let isActive = true; // evita que el callback async corra si el efecto ya fue limpiado

    // Inject Leaflet CSS once
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet-css', '1');
      document.head.appendChild(link);
    }

    // Destroy previous instance synchronously before the async import
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    import('leaflet').then((mod) => {
      if (!isActive || !containerRef.current) return;

      const L = mod.default ?? mod;

      if (containerRef.current._leaflet_id) return;

      // Convertir a número explícitamente para evitar concatenación de strings
      const sLat = parseFloat(storeLat);
      const sLng = parseFloat(storeLng);
      const uLat = userLat  ? parseFloat(userLat)  : null;
      const uLng = userLng  ? parseFloat(userLng)  : null;
      const r    = parseFloat(radiusKm) || 5;

      if (isNaN(sLat) || isNaN(sLng)) return;

      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl; // eslint-disable-line no-underscore-dangle
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: false,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([sLat, sLng]).addTo(map);

      L.circle([sLat, sLng], {
        radius:      r * 1000,
        color:       '#0f0f0f',
        fillColor:   '#0f0f0f',
        fillOpacity: 0.07,
        weight:      2,
        dashArray:   '6 4',
      }).addTo(map);

      if (uLat !== null && uLng !== null && !isNaN(uLat) && !isNaN(uLng)) {
        const icon = L.icon({ iconUrl: USER_ICON_SVG, iconSize: [24, 36], iconAnchor: [12, 36] });
        L.marker([uLat, uLng], { icon }).addTo(map);
      }

      // Ajustar vista
      if (uLat !== null && uLng !== null && !isNaN(uLat) && !isNaN(uLng)) {
        map.fitBounds(L.latLngBounds([sLat, sLng], [uLat, uLng]).pad(0.25));
      } else {
        const degLat = r / 111;
        const degLng = r / (111 * Math.cos(sLat * Math.PI / 180));
        map.fitBounds(
          L.latLngBounds(
            [sLat - degLat, sLng - degLng],
            [sLat + degLat, sLng + degLng],
          ).pad(0.1),
        );
      }

      // Forzar redibujado por si el contenedor tenía tamaño 0 al inicializar
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 100);
    });

    return () => {
      isActive = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLat, storeLng, radiusKm, userLat, userLng]);

  if (!storeLat || !storeLng) return null;

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: '6px', zIndex: 0, background: '#f0ede8' }}
    />
  );
}
