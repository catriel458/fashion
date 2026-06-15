// Fuente de unica verdad para los planes del probador virtual.

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price_usd: 0,
    monthly_limit: 20,
    daily_limit: 2,
    accent: '#374151',
    badge: null,
    description: 'Para probar el probador virtual sin costo.',
    features: [
      '20 probadas por mes',
      'Hasta 2 por usuario por dia',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price_usd: 9,
    monthly_limit: 100,
    daily_limit: 5,
    accent: '#64748b',
    badge: null,
    description: 'Para tiendas que recien arrancan con el probador virtual.',
    features: [
      '100 probadas por mes',
      'Hasta 5 por usuario por dia (configurable)',
      'Soporte por email',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price_usd: 25,
    monthly_limit: 300,
    daily_limit: 10,
    accent: '#7c3aed',
    badge: 'MAS POPULAR',
    description: 'Mas probadas y soporte prioritario para tiendas activas.',
    features: [
      '300 probadas por mes',
      'Hasta 10 por usuario por dia (configurable)',
      'Soporte prioritario',
      'El mas elegido por tiendas activas',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_usd: 59,
    monthly_limit: 800,
    daily_limit: 20,
    accent: '#d97706',
    badge: 'PARA CRECER',
    description: 'Para tiendas en crecimiento que quieren ver sus metricas.',
    features: [
      '800 probadas por mes',
      'Hasta 20 por usuario por dia (configurable)',
      'Panel de metricas de uso',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price_usd: 139,
    monthly_limit: 2000,
    daily_limit: 999,
    accent: '#059669',
    badge: 'ALTO VOLUMEN',
    description: 'Alto volumen, sin limites diarios y soporte dedicado.',
    features: [
      '2000 probadas por mes',
      'Sin limite diario',
      'SLA + soporte dedicado',
    ],
  },
};

// Lista ordenada de planes comprables, para renderizar cards en la UI del admin.
export const PLANS_LIST = [PLANS.starter, PLANS.growth, PLANS.pro, PLANS.scale];

export const PLAN_COLORS = {
  free: PLANS.free.accent,
  starter: PLANS.starter.accent,
  growth: PLANS.growth.accent,
  pro: PLANS.pro.accent,
  scale: PLANS.scale.accent,
};
