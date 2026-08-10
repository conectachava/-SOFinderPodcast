/**
 * Helper utility for AI Auto-Tagging of Podcast Episodes & Research Reports
 * Categorizes podcasts into standard domains like Tecnología, Finanzas, Ciencia, Educación, Negocios, etc.
 */

export const CATEGORY_TAGS = [
  "Tecnología",
  "Finanzas",
  "Ciencia",
  "Educación",
  "Negocios",
  "IA",
  "Salud",
  "Cultura",
  "Noticias",
  "Entretenimiento",
] as const;

export type CategoryTag = (typeof CATEGORY_TAGS)[number];

const CATEGORY_KEYWORDS: Record<CategoryTag, string[]> = {
  Tecnología: [
    "tech", "tecnolog", "software", "hardware", "app", "dispositivo", "iphone", "nvidia",
    "comput", "digital", "internet", "redes", "algoritmo", "codigo", "desarrollo", "gadget",
    "robot", "movil", "smartphone", "laptop", "cloud", "nube", "servidor"
  ],
  Finanzas: [
    "finanz", "invers", "cripto", "bitcoin", "bolsa", "dinero", "mercado", "economia",
    "banco", "acción", "ganancia", "presupuesto", "startup", "capital", "ingreso", "dolar",
    "moneda", "costo", "retorno", "roi", "earnings", "deuda"
  ],
  Ciencia: [
    "cienc", "investigaci", "espacio", "fisica", "quimica", "biolog", "astronom", "universo",
    "nasa", "quantum", "cuantic", "laboratorio", "descubrimiento", "genet", "clima", "planeta",
    "celula", "experimento", "neuro"
  ],
  Educación: [
    "educa", "aprender", "curso", "estudio", "tutoria", "tutorial", "conocimiento",
    "universidad", "escuela", "pedagog", "formacion", "capacita", "habilidad", "guia", "manual"
  ],
  Negocios: [
    "negocio", "empresa", "estrategia", "liderazgo", "marketing", "ventas", "gestion",
    "mantenimiento", "cliente", "fundador", "ceo", "emprend", "industria", "ejecutiv", "marca"
  ],
  IA: [
    "ia", "ai", "inteligencia artificial", "gemini", "gpt", "llm", "prompts", "neural",
    "machine learning", "deep learning", "red neuronal", "chatgpt", "openai", "copilot", "generativ"
  ],
  Salud: [
    "salud", "medicina", "bienestar", "nutricion", "ejercicio", "mente", "psicolog", "terapia",
    "doctor", "paciente", "longevidad", "sueño", "habito"
  ],
  Cultura: [
    "cultura", "arte", "musica", "cine", "libro", "historia", "filosofia", "sociedad",
    "literatura", "teatro", "diseño", "fotografia", "podcast"
  ],
  Noticias: [
    "noticia", "actualidad", "relevante", "tendencia", "urgente", "global", "evento",
    "boletin", "semanal", "resumen", "titular", "reporte"
  ],
  Entretenimiento: [
    "entretenimiento", "humor", "comedia", "juego", "gaming", "pelicula", "serie",
    "stream", "farándula", "deporte", "fútbol", "curiosidad"
  ],
};

/**
 * Automatically classifies podcast topics and texts into AI tags.
 */
export function generateAutoTags(
  topic: string = "",
  contentType: string = "",
  fullText: string = ""
): string[] {
  const combinedText = `${topic} ${contentType} ${fullText}`.toLowerCase();
  const matchedCategories = new Set<string>();

  // Check matching score for each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (combinedText.includes(kw)) {
        matchedCategories.add(category);
        break; // Match found for this category
      }
    }
  }

  // Fallback defaults if no categories matched
  if (matchedCategories.size === 0) {
    if (combinedText.includes("tecnol") || combinedText.includes("app")) {
      matchedCategories.add("Tecnología");
    } else if (combinedText.includes("negocio") || combinedText.includes("empresa")) {
      matchedCategories.add("Negocios");
    } else {
      matchedCategories.add("Tecnología");
      matchedCategories.add("Educación");
    }
  }

  // Max 3 tags
  return Array.from(matchedCategories).slice(0, 3);
}
