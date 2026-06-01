const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'CnB-App/1.0 (cnbappstore@gmail.com)';

export async function geocodeAddress(address) {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ar`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function searchAddress(query) {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ar`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(userLat, userLng, storeLat, storeLng, radiusKm) {
  return calculateDistance(userLat, userLng, storeLat, storeLng) <= radiusKm;
}
