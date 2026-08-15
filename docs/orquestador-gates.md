1. Actualización Crítica: Orquestador con "Validation Gates"
Este es el cambio más importante. Modificaremos el flujo de orquestación para que valide la salida de cada agente antes de pasarla al siguiente. Usaremos una librería como zod para la validación de esquemas, que es una práctica estándar en TypeScript.

Archivo a modificar: /app/api/orchestrator/route.ts (Este archivo es conceptual, asumo que tienes uno que maneja el flujo principal. Si no, esta sería la lógica a implementar).

Paso 1: Instalar zod
Primero, necesitas esta pequeña pero poderosa librería:

npm install zod
Paso 2: Código Actualizado del Orquestador
// /app/api/orchestrator/route.ts

import { z } from "zod";

// --- ESQUEMAS DE VALIDACIÓN (Validation Gates) ---

// Esquema para validar la salida del Agente 1 (SourceFinder)
const SourceFinderReportSchema = z.object({
  // Asumimos que el informe viene como un string de Markdown
  // Una validación más profunda podría parsear el Markdown
  informe: z.string().min(50, { message: "El informe de inteligencia parece demasiado corto o corrupto." }),
});

// Esquema para validar la salida del Agente 2 (ScriptWriter)
const ScriptWriterOutputSchema = z.object({
  // Asumimos que el guion viene como un string
  guion: z.string().min(50, { message: "El guion generado parece demasiado corto o corrupto." }),
});


// --- LÓGICA DEL ORQUESTADOR ACTUALIZADA ---

export async function POST(req: Request) {
  // ... (obtener parámetros del usuario: tema, duración, etc.)

  try {
    // --- FASE 1: SOURCE FINDER ---
    const informeResult = await callSourceFinderAPI(/* ...params */);

    // V A L I D A T I O N   G A T E   #1
    const validation1 = SourceFinderReportSchema.safeParse({ informe: informeResult });
    if (!validation1.success) {
      console.error("Validation Gate 1 falló:", validation1.error.message);
      // Política de reintento o error controlado
      // Por ejemplo, intentar llamar a la API una vez más
      throw new Error(`El informe del SourceFinder no superó la validación: ${validation1.error.message}`);
    }
    const informeValidado = validation1.data.informe;


    // --- FASE 2: SCRIPT WRITER ---
    const guionResult = await callScriptWriterAPI(informeValidado, /* ...otros params */);

    // V A L I D A T I O N   G A T E   #2
    const validation2 = ScriptWriterOutputSchema.safeParse({ guion: guionResult });
    if (!validation2.success) {
      console.error("Validation Gate 2 falló:", validation2.error.message);
      throw new Error(`El guion generado no superó la validación: ${validation2.error.message}`);
    }
    const guionValidado = validation2.data.guion;


    // --- FASE 3: STORYBOARDER (y así sucesivamente) ---
    // ...

    return Response.json({ status: "success", /* ... resultados ... */ });

  } catch (error: any) {
    console.error("Error en el pipeline de orquestación:", error.message);
    return Response.json({ status: "error", message: "Fallo en la cadena de producción.", details: error.message }, { status: 500 });
  }
}
2. Actualización de Seguridad: Rate Limiting y Sanitización
Para proteger tus endpoints de abusos y picos de costos. Usaremos limiter, una librería simple para este propósito.

Archivo a modificar: Cada una de tus route.ts (/app/api/source-finder/route.ts, etc.) o un middleware central.

Paso 1: Instalar limiter
npm install limiter
Paso 2: Código Actualizado del Endpoint (Ejemplo con source-finder)
// /app/api/source-finder/route.ts

import { RateLimiter } from "limiter";

// --- CONFIGURACIÓN DEL RATE LIMITER ---
// Permitir 10 peticiones cada 15 minutos por IP (ajusta según tus necesidades)
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: "15 minutes" });

export async function POST(req: Request) {
  // --- IMPLEMENTACIÓN DEL RATE LIMITER ---
  const remainingRequests = await limiter.removeTokens(1);
  if (remainingRequests < 0) {
    return new Response(
      JSON.stringify({ status: "error", message: "Demasiadas peticiones. Inténtalo más tarde." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // --- SANITIZACIÓN DE ENTRADA ---
  const body = await req.json();
  const { topicToResearch, contentType, query_modifier } = body;

  // Ejemplo: Limitar la longitud del tema de investigación
  if (topicToResearch.length > 200) {
      return Response.json({ status: "error", message: "El tema de investigación es demasiado largo." }, { status: 400 });
  }

  // ... resto de tu lógica para llamar a Gemini
}
3. Actualización de Lógica: Calificación de Fuentes Flexible
Hacemos que la lista de dominios sea externa para poder actualizarla sin tocar el código.

Archivo a crear: /config/reputation-map.json

{
  "top_tier_news": {
    "domains": ["bbc.com", "reuters.com", "apnews.com", "bloomberg.com"],
    "score": 0.95
  },
  "tech_press": {
    "domains": ["wired.com", "theverge.com", "techcrunch.com"],
    "score": 0.92
  },
  "entertainment": {
    "domains": ["variety.com", "hollywoodreporter.com", "tmz.com"],
    "score": 0.82
  },
  "community": {
    "domains": ["reddit.com", "medium.com", "substack.com"],
    "score": 0.55
  },
  "default_unverified": {
    "score": 0.20
  }
}
Archivo a modificar: El archivo de utilidades donde reside tu función getDomainReputation.

// /utils/reputation.ts (o donde esté la función)

import reputationMap from '@/config/reputation-map.json';

export function getDomainReputation(urlStr: string): { score: number; tier: string } {
  try {
    const domain = new URL(urlStr).hostname.replace('www.', '');

    for (const [tier, config] of Object.entries(reputationMap)) {
      if (tier !== 'default_unverified' && config.domains.some(d => domain.includes(d))) {
        return { score: config.score, tier: tier };
      }
    }

    // Si no se encuentra en ninguna lista, devuelve el score por defecto
    return { score: reputationMap.default_unverified.score, tier: 'unverified' };

  } catch (error) {
    console.error("Error al parsear URL para reputación:", urlStr);
    return { score: 0.1, tier: 'error_parsing' }; // Score muy bajo si la URL es inválida
  }
}
4. Actualización de Consistencia: Persistencia de Personajes
Modificamos el agente storyboarder para que guarde y recupere las descripciones de los locutores en Firestore.

Archivo a modificar: /app/api/storyboard/route.ts

// /app/api/storyboard/route.ts
import { db } from '@/lib/firebase-admin'; // Asumo que tienes un archivo para inicializar Firebase Admin

export async function POST(req: Request) {
  const { guion } = await req.json();

  // 1. Extraer los nombres de los locutores del guion
  const speakerNames = extractSpeakersFromScript(guion); // Necesitas implementar esta función
  
  const characters: { [key: string]: string } = {};
  
  for (const name of speakerNames) {
    // 2. Buscar si el personaje ya existe en Firestore
    const characterRef = db.collection('podcast_characters').doc(name);
    const doc = await characterRef.get();

    if (doc.exists) {
      // 3. Si existe, reutilizar su descripción
      characters[name] = doc.data()?.description;
    } else {
      // 4. Si no existe, generarla por primera vez
      const newDescription = await generateCharacterDescription(name); // Llama a una IA para crear la descripción
      
      // 5. Guardar la nueva descripción en Firestore para futuras ejecuciones
      await characterRef.set({ name: name, description: newDescription, createdAt: new Date() });
      characters[name] = newDescription;
    }
  }

  // 6. Ahora, con los personajes ya definidos y consistentes, llama a la IA principal
  // para generar el storyboard pasándole este objeto `characters`.
  
  // ... resto de la lógica para generar las escenas del storyboard
}
Estas actualizaciones abordan directamente los puntos que identificamos, haciendo tu aplicación más segura, confiable y profesional.