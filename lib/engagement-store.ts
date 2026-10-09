export type LoyaltyTierId = "bronce" | "plata" | "oro" | "visionario";

export interface LoyaltyTierInfo {
  id: LoyaltyTierId;
  name: string;
  minXp: number;
  nextTierXp: number | null;
  badgeColor: string;
  perks: string[];
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  costXp: number;
  category: "tokens" | "template" | "audio_preset" | "badge";
  tokenBonus?: number;
}

export interface LoyaltyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

export interface LoyaltyState {
  xp: number;
  streakDays: number;
  lastCheckInDate: string;
  unlockedRewards: string[];
  completedMissions: string[];
  bonusTokensEarned: number;
}

export type PersonalizationCategoryId =
  | "ia"
  | "ciencia"
  | "economia"
  | "ciberseguridad"
  | "salud"
  | "energia";

export interface ContentPersonalizationPrefs {
  categories: PersonalizationCategoryId[];
  preferredFormat: "Debate" | "Análisis" | "Opinión";
  preferredDuration: "5m" | "15m" | "30m";
  editorialTone: "riguroso" | "dinamico" | "documental" | "ejecutivo";
  autoApplyToStudio: boolean;
}

export interface PersonalizedTopicSuggestion {
  id: string;
  category: PersonalizationCategoryId;
  categoryLabel: string;
  topic: string;
  contentType: string;
  format: "Debate" | "Análisis" | "Opinión";
  estimatedDuration: string;
  matchScore: number;
}

export interface PushNotificationSettings {
  enabled: boolean;
  topics: {
    trends: boolean;
    episodes: boolean;
    loyalty: boolean;
    updates: boolean;
  };
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  category: "trends" | "episodes" | "loyalty" | "updates";
  createdAt: string;
  read: boolean;
}

export interface UserFeedbackEntry {
  id: string;
  rating: number;
  category: "ux" | "velocidad" | "voces" | "seo" | "funciones" | "bug";
  message: string;
  createdAt: string;
  userEmail?: string;
  status: "recibido" | "en_revision" | "implementado";
}

export interface FeatureRoadmapItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  votes: number;
  userVoted: boolean;
  status: "En Desarrollo" | "Planificado" | "Recién Lanzado";
}

export interface AppReleaseNote {
  version: string;
  date: string;
  title: string;
  badge: "Estable" | "Nuevo" | "Seguridad";
  highlights: string[];
  fixes: string[];
  performanceGain: string;
}

export const LOYALTY_TIERS: LoyaltyTierInfo[] = [
  {
    id: "bronce",
    name: "Explorador Bronce",
    minXp: 0,
    nextTierXp: 300,
    badgeColor: "amber",
    perks: [
      "Acceso al Orquestador y Agente SourceFinder",
      "Exportación de guiones en Markdown y JSON",
    ],
  },
  {
    id: "plata",
    name: "Productor Plata",
    minXp: 300,
    nextTierXp: 700,
    badgeColor: "slate",
    perks: [
      "Prioridad en cola de síntesis multivoz",
      "Plantillas narrativas de debate extendido",
      "+10% en bonos de fidelización por episodio",
    ],
  },
  {
    id: "oro",
    name: "Director Editorial Oro",
    minXp: 700,
    nextTierXp: 1500,
    badgeColor: "yellow",
    perks: [
      "Desbloqueo de presets acústicos Broadcast -14 LUFS",
      "Carátulas Imagen 3 con estilos cinematográficos extra",
      "Insignia de Director en exportaciones de proyecto",
    ],
  },
  {
    id: "visionario",
    name: "Visionario VSNRY",
    minXp: 1500,
    nextTierXp: null,
    badgeColor: "indigo",
    perks: [
      "Acceso anticipado a funciones experimentales de IA",
      "Multiplicador x1.5 XP en misiones semanales",
      "Perfil destacado en el Club de Creadores SourceFinder",
    ],
  },
];

export const LOYALTY_MISSIONS: LoyaltyMission[] = [
  {
    id: "mission_daily_checkin",
    title: "Check-in Diario de Creador",
    description: "Mantén tu racha activa abriendo el estudio hoy.",
    xpReward: 50,
  },
  {
    id: "mission_personalize",
    title: "Configurar Preferencias de Contenido",
    description: "Personaliza tus categorías y formato favorito de podcast.",
    xpReward: 75,
  },
  {
    id: "mission_push_optin",
    title: "Activar Alertas Inteligentes Push",
    description: "Mantente al día con tendencias verificadas y estado de tus episodios.",
    xpReward: 80,
  },
  {
    id: "mission_sourcefinder",
    title: "Auditar Fuentes o Generar Episodio",
    description: "Ejecuta una investigación o guion verificado en el pipeline.",
    xpReward: 150,
  },
  {
    id: "mission_feedback",
    title: "Enviar Feedback de Mejora Continua",
    description: "Comparte tu opinión o vota por una función para mejorar la app.",
    xpReward: 100,
  },
];

export const LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: "reward_tokens_1500",
    title: "Bono +1,500 Tokens de Estudio IA",
    description: "Amplía tu capacidad mensual para síntesis TTS y auditoría de fuentes.",
    costXp: 200,
    category: "tokens",
    tokenBonus: 1500,
  },
  {
    id: "reward_template_bbc",
    title: "Plantilla: Documental Investigativo Pro",
    description: "Estructura narrativa en 4 actos con tensión dramática y verificación cruzada.",
    costXp: 350,
    category: "template",
  },
  {
    id: "reward_preset_dolby",
    title: "Preset Acústico: Warm Broadcast -14 LUFS",
    description: "Curva EQ cálida y compresión suave optimizada para Spotify y Apple Podcasts.",
    costXp: 500,
    category: "audio_preset",
  },
  {
    id: "reward_badge_vsnry",
    title: "Insignia Creador Verificado VSNRY LABS",
    description: "Distintivo exclusivo de miembro fundador en tu perfil y carátulas exportadas.",
    costXp: 800,
    category: "badge",
  },
];

export const PERSONALIZATION_CATEGORIES: {
  id: PersonalizationCategoryId;
  label: string;
  description: string;
}[] = [
  {
    id: "ia",
    label: "Inteligencia Artificial & Robótica",
    description: "Modelos fundacionales, agentes autónomos y computación acelerada.",
  },
  {
    id: "ciencia",
    label: "Ciencia, Espacio & Física",
    description: "Exploración espacial, fusión nuclear y descubrimientos revisados por pares.",
  },
  {
    id: "economia",
    label: "Economía Digital & Mercados",
    description: "Macroeconomía, regulación fintech, bancos centrales y futuro del trabajo.",
  },
  {
    id: "ciberseguridad",
    label: "Ciberseguridad & Criptografía",
    description: "Defensa zero-trust, criptografía post-cuántica y privacidad de datos.",
  },
  {
    id: "salud",
    label: "Biotecnología & Salud de Precisión",
    description: "Genómica CRISPR, longevidad, neurotecnología y ensayos clínicos.",
  },
  {
    id: "energia",
    label: "Transición Energética & Clima",
    description: "Baterías de estado sólido, redes inteligentes e innovación sostenible.",
  },
];

const TOPIC_CATALOG: Omit<PersonalizedTopicSuggestion, "matchScore">[] = [
  {
    id: "top_ia_1",
    category: "ia",
    categoryLabel: "Inteligencia Artificial",
    topic: "Agentes Autónomos Multimodales en Ingeniería de Software y Ciencia",
    contentType: "Análisis Profundo",
    format: "Debate",
    estimatedDuration: "15m",
  },
  {
    id: "top_ia_2",
    category: "ia",
    categoryLabel: "Inteligencia Artificial",
    topic: "Arquitecturas NPU Locales vs Superclusters en la Nube hacia 2027",
    contentType: "Noticia Tecnológica",
    format: "Análisis",
    estimatedDuration: "15m",
  },
  {
    id: "top_cie_1",
    category: "ciencia",
    categoryLabel: "Ciencia y Espacio",
    topic: "Reactores Tokamak de Alta Temperatura y Fusión Comercial en la Red Eléctrica",
    contentType: "Investigación Científica",
    format: "Análisis",
    estimatedDuration: "30m",
  },
  {
    id: "top_eco_1",
    category: "economia",
    categoryLabel: "Economía Digital",
    topic: "Impacto Productivo de la Automatización Cognitiva en Mercados Emergentes",
    contentType: "Análisis Económico",
    format: "Debate",
    estimatedDuration: "15m",
  },
  {
    id: "top_cib_1",
    category: "ciberseguridad",
    categoryLabel: "Ciberseguridad",
    topic: "Migración Global a Estándares NIST de Criptografía Post-Cuántica",
    contentType: "Alerta de Seguridad",
    format: "Análisis",
    estimatedDuration: "5m",
  },
  {
    id: "top_sal_1",
    category: "salud",
    categoryLabel: "Biotecnología y Salud",
    topic: "Terapias Génicas de Edición Base in-vivo y Medicina Personalizada",
    contentType: "Reporte Médico",
    format: "Opinión",
    estimatedDuration: "15m",
  },
  {
    id: "top_ene_1",
    category: "energia",
    categoryLabel: "Energía y Clima",
    topic: "Baterías de Estado Sólido de Sodio y Almacenamiento Estacionario Masivo",
    contentType: "Innovación Industrial",
    format: "Análisis",
    estimatedDuration: "15m",
  },
];

export const APP_RELEASES: AppReleaseNote[] = [
  {
    version: "v2.6.0",
    date: "Octubre 2026",
    title: "Growth, Fidelización, SEO Avanzado & Ajustes de Voz Pro",
    badge: "Nuevo",
    highlights: [
      "Nuevo Hub de Fidelización (SourceFinder Creator Club) con niveles, rachas y canje de recompensas.",
      "Panel de Ajustes de Voz Pro por línea de diálogo (Tono en semitonos, Velocidad y Énfasis Emocional).",
      "Sistema de Notificaciones Push nativas e in-app para tendencias y alertas de síntesis.",
      "Motor de Personalización de Contenido según tus intereses temáticos y formato editorial.",
      "Módulo de Feedback continuo y votación de próximas funciones de la comunidad.",
    ],
    fixes: [
      "Optimización de reglas y reconexión resiliente de Firestore sin advertencias de permisos.",
      "Mejora en tiempos de respuesta del reproductor Web Audio y sincronización de velocidad por línea.",
    ],
    performanceGain: "+38% velocidad de carga percibida y soporte PWA instalable",
  },
  {
    version: "v2.5.0",
    date: "Septiembre 2026",
    title: "Imagen 3 Cover Art Studio, Voice Clone & Dashboard Recharts",
    badge: "Estable",
    highlights: [
      "Generador de carátulas de episodios integrado en el Podcast Studio con Imagen 3.",
      "Componente Voice Clone para registrar y gestionar perfiles de voz personalizados con IA.",
      "Dashboard de analítica con Recharts: tasa de retención, tiempo de escucha y crecimiento.",
      "Selector de tema fluido (Siempre Claro, Siempre Oscuro, Sincronizar con Sistema).",
    ],
    fixes: [
      "Corrección de resolución DNS y cabeceras de seguridad en rutas de API.",
      "Transiciones CSS suaves libres de parpadeo entre modo claro y oscuro.",
    ],
    performanceGain: "-24% uso de memoria en sesiones largas de edición",
  },
  {
    version: "v2.4.0",
    date: "Agosto 2026",
    title: "Motor Google Search Grounding & Masterización Broadcast -16 LUFS",
    badge: "Seguridad",
    highlights: [
      "Auditoría de fuentes en tiempo real con puntuación de credibilidad verificada.",
      "Cadena de masterización acústica con compresión dinámica y normalización EBU R128.",
    ],
    fixes: [
      "Validación estricta de esquemas y protección contra sobrecarga en peticiones TTS.",
    ],
    performanceGain: "99.9% estabilidad en exportación WAV de alta definición",
  },
];

export const DEFAULT_ROADMAP_ITEMS: FeatureRoadmapItem[] = [
  {
    id: "feat_rss_spotify",
    title: "Publicación Directa RSS a Spotify & Apple Podcasts",
    description: "Distribución en un clic con metadatos ID3, capítulos y carátula generada.",
    tag: "Distribución",
    votes: 148,
    userVoted: false,
    status: "En Desarrollo",
  },
  {
    id: "feat_multilang_dub",
    title: "Doblaje Simultáneo Multilingüe (ES / EN / PT / FR)",
    description: "Adapta un mismo episodio verificado a 4 idiomas conservando el timbre vocal.",
    tag: "Audio IA",
    votes: 112,
    userVoted: false,
    status: "Planificado",
  },
  {
    id: "feat_live_cohost",
    title: "Intervención en Vivo del Usuario durante el Debate",
    description: "Permite interrumpir con micrófono a los hosts virtuales para hacer preguntas en tiempo real.",
    tag: "Interactivo",
    votes: 94,
    userVoted: false,
    status: "Planificado",
  },
  {
    id: "feat_pro_voice_dsp",
    title: "Ajustes de Voz Pro por Línea (Tono, Velocidad y Emoción)",
    description: "Calibración granular línea por línea antes de la síntesis de audio.",
    tag: "Estudio Pro",
    votes: 215,
    userVoted: true,
    status: "Recién Lanzado",
  },
];

export function getDefaultLoyaltyState(): LoyaltyState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    xp: 220,
    streakDays: 3,
    lastCheckInDate: today,
    unlockedRewards: [],
    completedMissions: ["mission_daily_checkin"],
    bonusTokensEarned: 0,
  };
}

export function getDefaultPersonalizationPrefs(): ContentPersonalizationPrefs {
  return {
    categories: ["ia", "ciencia", "economia"],
    preferredFormat: "Debate",
    preferredDuration: "15m",
    editorialTone: "riguroso",
    autoApplyToStudio: true,
  };
}

export function getDefaultPushSettings(): PushNotificationSettings {
  return {
    enabled: false,
    topics: {
      trends: true,
      episodes: true,
      loyalty: true,
      updates: true,
    },
  };
}

export function calculateLoyaltyTier(xp: number): {
  current: LoyaltyTierInfo;
  next: LoyaltyTierInfo | null;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  let current = LOYALTY_TIERS[0];
  let next: LoyaltyTierInfo | null = LOYALTY_TIERS[1];

  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (safeXp >= LOYALTY_TIERS[i].minXp) {
      current = LOYALTY_TIERS[i];
      next = LOYALTY_TIERS[i + 1] || null;
    }
  }

  if (!next) {
    return { current, next: null, progressPercent: 100 };
  }

  const span = next.minXp - current.minXp;
  const gainedInTier = safeXp - current.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((gainedInTier / span) * 100))
  );

  return { current, next, progressPercent };
}

export function awardLoyaltyXp(
  state: LoyaltyState,
  amount: number,
  missionId?: string
): { nextState: LoyaltyState; leveledUp: boolean; previousTier: LoyaltyTierId; newTier: LoyaltyTierId } {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (missionId && state.completedMissions.includes(missionId)) {
    const tier = calculateLoyaltyTier(state.xp).current.id;
    return {
      nextState: state,
      leveledUp: false,
      previousTier: tier,
      newTier: tier,
    };
  }

  const prevTier = calculateLoyaltyTier(state.xp).current.id;
  const nextXp = state.xp + safeAmount;
  const newTier = calculateLoyaltyTier(nextXp).current.id;

  const nextCompleted = missionId
    ? Array.from(new Set([...state.completedMissions, missionId]))
    : state.completedMissions;

  return {
    nextState: {
      ...state,
      xp: nextXp,
      completedMissions: nextCompleted,
    },
    leveledUp: prevTier !== newTier,
    previousTier: prevTier,
    newTier,
  };
}

export function redeemLoyaltyReward(
  state: LoyaltyState,
  rewardId: string
): { success: boolean; error?: string; nextState: LoyaltyState; reward?: LoyaltyReward } {
  const reward = LOYALTY_REWARDS.find((r) => r.id === rewardId);
  if (!reward) {
    return { success: false, error: "Recompensa no encontrada.", nextState: state };
  }
  if (state.unlockedRewards.includes(rewardId)) {
    return { success: false, error: "Esta recompensa ya fue canjeada.", nextState: state };
  }
  if (state.xp < reward.costXp) {
    return {
      success: false,
      error: `Necesitas ${reward.costXp - state.xp} XP adicionales para canjear esta recompensa.`,
      nextState: state,
    };
  }

  return {
    success: true,
    reward,
    nextState: {
      ...state,
      xp: state.xp - reward.costXp,
      unlockedRewards: [...state.unlockedRewards, rewardId],
      bonusTokensEarned: state.bonusTokensEarned + (reward.tokenBonus || 0),
    },
  };
}

export function getPersonalizedTopicRecommendations(
  prefs: ContentPersonalizationPrefs
): PersonalizedTopicSuggestion[] {
  const activeCategories =
    prefs.categories.length > 0 ? prefs.categories : (["ia", "ciencia"] as PersonalizationCategoryId[]);

  const scored = TOPIC_CATALOG.map((item) => {
    let score = 65;
    if (activeCategories.includes(item.category)) {
      score += 25;
    }
    if (item.format === prefs.preferredFormat) {
      score += 7;
    }
    if (item.estimatedDuration === prefs.preferredDuration) {
      score += 3;
    }
    return {
      ...item,
      format: prefs.autoApplyToStudio ? prefs.preferredFormat : item.format,
      matchScore: Math.min(99, score),
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

export function validateFeedbackInput(
  rating: number,
  category: string,
  message: string
): { valid: boolean; error?: string } {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: "Selecciona una calificación entre 1 y 5 estrellas." };
  }
  const validCategories = ["ux", "velocidad", "voces", "seo", "funciones", "bug"];
  if (!validCategories.includes(category)) {
    return { valid: false, error: "Selecciona una categoría válida." };
  }
  const trimmed = message.trim();
  if (trimmed.length < 8) {
    return {
      valid: false,
      error: "Escribe al menos 8 caracteres para describir tu sugerencia o comentario.",
    };
  }
  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: "El comentario no debe superar los 1,000 caracteres.",
    };
  }
  return { valid: true };
}
