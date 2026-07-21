import { callTryOnIa } from './tryOnIa';

/**
 * Procesa la simulación de vestidor virtual (Try-On) con IA de manera síncrona o asíncrona.
 * @param {object} params - Parámetros de la simulación
 * @param {string} params.userPhoto - URL o base64 de la foto del usuario
 * @param {string[]} params.garments - Array de URLs o base64 de las prendas
 * @returns {Promise<{resultImageUrl: string, expiresAt: string}>}
 */
export async function processFitting({ userPhoto, garments, height, weight }) {
  // Validaciones obligatorias
  if (!userPhoto || typeof userPhoto !== 'string' || userPhoto.trim() === '') {
    throw new Error('El campo "userPhoto" es requerido y debe ser un string válido (URL o base64).');
  }

  if (!garments || !Array.isArray(garments)) {
    throw new Error('El campo "garments" es requerido y debe ser un array.');
  }

  if (garments.length < 1 || garments.length > 5) {
    throw new Error('El listado "garments" debe contener entre 1 y 5 elementos.');
  }

  // Llamar a la IA real utilizando el helper unificado compartido
  const resultImageUrl = await callTryOnIa({
    personImage: userPhoto,
    clothingImages: garments,
    height,
    weight
  });

  // Generar timestamp con 1 hora de validez
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    resultImageUrl,
    expiresAt
  };
}
