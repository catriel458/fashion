import sql from './db'
import { createNotification } from './notify'

// Definicion de niveles
export const LEVELS = {
  explorador:  { min: 0,    max: 99,   label: 'Explorador',  color: '#64748b', emoji: '🌱' },
  fashionista: { min: 100,  max: 299,  label: 'Fashionista', color: '#7c3aed', emoji: '✨' },
  vip:         { min: 300,  max: 699,  label: 'VIP',         color: '#d97706', emoji: '⭐' },
  icono:       { min: 700,  max: 99999, label: 'Ícono',      color: '#059669', emoji: '👑' },
}

// Puntos por accion
export const POINT_RULES = {
  purchase:     { points: 10,  description: 'Compra realizada'      },
  tryon:        { points: 2,   description: 'Probada virtual usada' },
  first_tryon:  { points: 15,  description: 'Primera probada virtual' },
  welcome:      { points: 5,   description: 'Bienvenida a la tienda' },
}

export function getLevelForPoints(points) {
  for (const [key, level] of Object.entries(LEVELS)) {
    if (points >= level.min && points <= level.max) return key
  }
  return 'explorador'
}

export async function addPoints(userId, storeId, reason, customPoints) {
  const rule = POINT_RULES[reason]
  if (!rule && customPoints === undefined) return

  const pts = customPoints ?? rule.points
  const desc = rule?.description ?? 'Puntos agregados'

  // Sumar puntos al usuario
  const [updated] = await sql`
    UPDATE users SET points = points + ${pts}
    WHERE id = ${userId}
    RETURNING points
  `

  // Calcular nuevo nivel
  const newLevel = getLevelForPoints(updated.points)
  const [current] = await sql`
    SELECT level FROM users WHERE id = ${userId}
  `

  // Si subio de nivel, actualizar y notificar
  if (newLevel !== current.level) {
    await sql`UPDATE users SET level = ${newLevel} WHERE id = ${userId}`
    const levelData = LEVELS[newLevel]
    await createNotification({
      userId,
      storeId,
      type: 'level_up',
      title: `Subiste de nivel! Ahora sos ${levelData.label} ${levelData.emoji}`,
      message: `Alcanzaste ${updated.points} puntos. Seguí comprando para llegar al siguiente nivel.`,
      link: '/profile/benefits',
    })
  }

  // Registrar en historial
  await sql`
    INSERT INTO points_history (user_id, store_id, points, reason, description)
    VALUES (${userId}, ${storeId}, ${pts}, ${reason}, ${desc})
  `

  return { points: updated.points, level: newLevel }
}
