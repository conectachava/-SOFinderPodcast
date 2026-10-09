/**
 * SourceFinder Pod — Public Podcasts Repository
 * Manages public podcast projects for OpenGraph meta tags, dynamic sitemap indexing, and public episode pages.
 */

export interface PublicPodcastItem {
  id: string;
  title: string;
  topic: string;
  description: string;
  contentType: string;
  format: "Debate" | "Análisis" | "Opinión";
  status: "Ready" | "Failed" | "Processing";
  duration: string;
  date: string;
  coverArt?: string;
  audioUrl?: string;
  scriptLinesCount?: number;
  userId?: string;
  authorName?: string;
  updatedAt?: string;
  tags?: string[];
  reportSnippet?: string;
  reportText?: string;
  rawScript?: string;
}

// Built-in seed episodes for immediate crawlability and rich demo previews
export const SEED_PODCASTS: PublicPodcastItem[] = [
  {
    id: "ep-gemini-multimodal",
    title: "Gemini 2.5 Flash y el Salto Multimodal en Audio",
    topic: "Avances de Gemini 2.5 Flash en síntesis de audio nativa y razonamiento multimodal",
    description: "Análisis profundo sobre la arquitectura de tokens de audio en tiempo real de Gemini 2.5, latencia ultra-baja y doblaje multivoz adaptativo sin transcripción intermedia.",
    contentType: "Análisis Tecnológico",
    format: "Análisis",
    status: "Ready",
    duration: "14:20",
    date: "2026-10-05",
    coverArt: "https://picsum.photos/seed/gemini-audio/1200/630",
    scriptLinesCount: 18,
    authorName: "SourceFinder Editorial Lab",
    updatedAt: "2026-10-05T14:30:00.000Z",
    tags: ["Gemini AI", "Audio Multimodal", "Tecnología", "Deep Learning", "Google Cloud"],
    reportSnippet: "Evaluación técnica de benchmarks de inferencia de audio en tiempo real y fidelidad espectral.",
  },
  {
    id: "ep-search-grounding",
    title: "Fact-Checking Algorítmico con Google Search Grounding",
    topic: "Verificación automatizada de fuentes periodísticas y auditoría de alucinaciones en modelos de lenguaje",
    description: "Cómo la integración de Google Search Grounding permite contrastar noticias de última hora en milisegundos con atribución explícita de citas y reputación de dominio.",
    contentType: "Investigación Periodística",
    format: "Debate",
    status: "Ready",
    duration: "18:45",
    date: "2026-10-06",
    coverArt: "https://picsum.photos/seed/search-grounding/1200/630",
    scriptLinesCount: 24,
    authorName: "SourceFinder Fact Check",
    updatedAt: "2026-10-06T18:00:00.000Z",
    tags: ["Fact-Checking", "Search Grounding", "Periodismo", "Verificación", "IA Ética"],
    reportSnippet: "Auditoría de fiabilidad de fuentes con enlaces citables y métricas de reputación web.",
  },
  {
    id: "ep-ia-medicina",
    title: "Diagnóstico Clínico Asistido por Inteligencia Artificial",
    topic: "Aplicaciones de agentes de IA en radiología, oncología y medicina personalizada en 2026",
    description: "Debate multidisciplinar entre médicos y bioinformáticos sobre la validación clínica de agentes diagnósticos multimodales y la privacidad del expediente electrónico.",
    contentType: "Ciencia & Salud",
    format: "Debate",
    status: "Ready",
    duration: "21:10",
    date: "2026-10-07",
    coverArt: "https://picsum.photos/seed/medicina-ia/1200/630",
    scriptLinesCount: 26,
    authorName: "Panel Médico Digital",
    updatedAt: "2026-10-07T11:20:00.000Z",
    tags: ["Medicina", "Salud", "IA Clínica", "Biotecnología", "Investigación"],
    reportSnippet: "Revisión de ensayos clínicos multicéntricos y aprobación regulatoria FDA/EMA.",
  },
  {
    id: "ep-agentes-autonomos",
    title: "La Nueva Economía de los Agentes Autónomos",
    topic: "Coordinación entre enjambres de agentes de software, microtransacciones y gobernanza descentralizada",
    description: "Perspectivas económicas y regulatorias sobre sistemas de agentes que negocian APIs, planifican logística y ejecutan código autónomo en producción.",
    contentType: "Economía & Negocios",
    format: "Opinión",
    status: "Ready",
    duration: "16:30",
    date: "2026-10-08",
    coverArt: "https://picsum.photos/seed/agentes-ia/1200/630",
    scriptLinesCount: 20,
    authorName: "VSNRY LABS Insights",
    updatedAt: "2026-10-08T09:00:00.000Z",
    tags: ["Agentes Autónomos", "Economía", "Productividad", "Software", "Futuro"],
    reportSnippet: "Ecosistema de agentes inteligentes y métricas de automatización empresarial.",
  },
];

// In-memory runtime cache for server-side SSR/SSG rendering
const inMemoryPublicPodcasts = new Map<string, PublicPodcastItem>();
SEED_PODCASTS.forEach((p) => inMemoryPublicPodcasts.set(p.id, p));

/**
 * Saves a podcast item to the public repository (Firestore 'podcasts' collection & local cache)
 */
export async function savePublicPodcast(podcast: PublicPodcastItem): Promise<boolean> {
  const item: PublicPodcastItem = {
    ...podcast,
    updatedAt: podcast.updatedAt || new Date().toISOString(),
    status: podcast.status || "Ready",
    format: podcast.format || "Análisis",
    description:
      podcast.description ||
      `Episodio de podcast sobre ${podcast.topic} investigado con Google Search Grounding y producido en SourceFinder Pod.`,
    tags: podcast.tags && podcast.tags.length > 0 ? podcast.tags : ["Podcast", "SourceFinder", "IA"],
  };

  inMemoryPublicPodcasts.set(item.id, item);

  // Client-side Firestore save
  if (typeof window !== "undefined") {
    try {
      const { db, auth } = await import("./firebase");
      if (db) {
        const { doc, setDoc } = await import("firebase/firestore");
        const docRef = doc(db, "podcasts", item.id);
        const firestorePayload: any = {
          id: item.id,
          title: item.title.slice(0, 200),
          topic: (item.topic || "").slice(0, 500),
          description: (item.description || "").slice(0, 5000),
          contentType: (item.contentType || "General").slice(0, 100),
          format: item.format,
          status: item.status,
          duration: (item.duration || "10:00").slice(0, 20),
          date: (item.date || new Date().toISOString().slice(0, 10)).slice(0, 50),
          updatedAt: item.updatedAt,
          tags: (item.tags || []).slice(0, 10),
        };

        if (item.coverArt) firestorePayload.coverArt = item.coverArt.slice(0, 500000);
        if (item.audioUrl) firestorePayload.audioUrl = item.audioUrl.slice(0, 500000);
        if (typeof item.scriptLinesCount === "number") firestorePayload.scriptLinesCount = item.scriptLinesCount;
        if (auth?.currentUser?.uid) firestorePayload.userId = auth.currentUser.uid;
        if (item.authorName) firestorePayload.authorName = item.authorName.slice(0, 100);

        await setDoc(docRef, firestorePayload, { merge: true });
        return true;
      }
    } catch (clientErr) {
      console.warn("[savePublicPodcast] Client save notice:", clientErr);
    }
  }

  // Server-side Firestore save via admin SDK if running on server
  if (typeof window === "undefined") {
    try {
      const { getAdminDb } = await import("./firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const docRef = adminDb.collection("podcasts").doc(item.id);
        await docRef.set(item, { merge: true });
        return true;
      }
    } catch (serverErr) {
      console.warn("[savePublicPodcast] Server admin save notice:", serverErr);
    }
  }

  return true;
}

/**
 * Retrieves a single public podcast by ID, checking Firestore first and falling back to memory/seed
 */
export async function getPublicPodcast(id: string): Promise<PublicPodcastItem | null> {
  if (!id) return null;

  // Try Server-side Admin DB if running in Next.js Server Component
  if (typeof window === "undefined") {
    try {
      const { getAdminDb } = await import("./firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("podcasts").doc(id).get();
        if (snap.exists) {
          const data = snap.data() as PublicPodcastItem;
          inMemoryPublicPodcasts.set(id, data);
          return data;
        }
      }
    } catch (err) {
      // Gracefully continue to memory cache
    }
  }

  // Try Client-side Firestore if running in browser
  if (typeof window !== "undefined") {
    try {
      const { db } = await import("./firebase");
      if (db) {
        const { doc, getDoc } = await import("firebase/firestore");
        const docRef = doc(db, "podcasts", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as PublicPodcastItem;
          inMemoryPublicPodcasts.set(id, data);
          return data;
        }
      }
    } catch (err) {
      // Gracefully continue to memory cache
    }
  }

  // Fallback to in-memory / seed episodes
  if (inMemoryPublicPodcasts.has(id)) {
    return inMemoryPublicPodcasts.get(id)!;
  }

  // If ID matches a slugified title from seeds
  const seedMatch = SEED_PODCASTS.find((p) => p.id === id || p.title.toLowerCase().includes(id.toLowerCase()));
  if (seedMatch) return seedMatch;

  return null;
}

/**
 * Retrieves all public podcasts for dynamic sitemap indexing
 */
export async function getAllPublicPodcasts(): Promise<PublicPodcastItem[]> {
  const resultList: PublicPodcastItem[] = [];
  const seenIds = new Set<string>();

  // Add all in-memory and seed episodes
  SEED_PODCASTS.forEach((p) => {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      resultList.push(p);
    }
  });

  inMemoryPublicPodcasts.forEach((p, id) => {
    if (!seenIds.has(id)) {
      seenIds.add(id);
      resultList.push(p);
    }
  });

  // Query Firestore collection if on server
  if (typeof window === "undefined") {
    try {
      const { getAdminDb } = await import("./firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("podcasts").limit(50).get();
        snap.forEach((doc) => {
          const data = doc.data() as PublicPodcastItem;
          if (data && data.id && !seenIds.has(data.id)) {
            seenIds.add(data.id);
            resultList.push(data);
          }
        });
      }
    } catch {
      // Fallback already populated
    }
  }

  return resultList;
}
