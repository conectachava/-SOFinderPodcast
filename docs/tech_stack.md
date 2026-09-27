# Descripción del Stack Tecnológico - SourceFinder Pod v0.1.0

## 1. Arquitectura Frontend y UI

- **Framework Principal:** Next.js `^16.3.6` (versión resuelta en el lockfile: 16.3.6) con la arquitectura App Router (`/app`).
- **Biblioteca de Vista:** React 19.2.8.
- **Lenguaje:** TypeScript 5.9.3 con tipado estricto habilitado (`tsconfig.json`).
- **Estilos y Utility Framework:** Tailwind CSS 4.1.11 en combinación con `@tailwindcss/postcss` y `tw-animate-css`.
- **Motor de Animación:** Motion 12.23.24 (importado desde `motion/react`).
- **Iconografía:** Lucide React 0.553.0.
- **Visualización e Indicadores:** Recharts 3.10.1 (para analíticas y métricas).
- **Formateo de Contenido:** `react-markdown` 10.1.0 y `remark-gfm` 4.0.1.

---

## 2. Infraestructura de Inteligencia Artificial (SDK & Modelos)

- **SDK Oficial:** `@google/genai` v2.4.0 (`GoogleGenAI`).
- **Modelos Utilizados:**
  - **`gemini-3.6-flash`**: Empleado para la investigación profunda de noticias con Google Search Grounding (`googleSearch`), analista de señales de tendencias globales, generación de guiones de radio multilocutor y refinamiento inteligente.
  - **`gemini-3.5-flash`**: Empleado para la descomposición y creación del Storyboard visual con formato JSON estricto.
  - **`gemini-3.1-flash-tts-preview`**: Empleado para la síntesis de voz en tiempo real con soporte multilocutor (`multiSpeakerVoiceConfig`).

---

## 3. Backend, Persistencia y Autenticación

- **Runtime de Servidor:** Node.js habilitado para ESM / Next.js Serverless API Routes (`app/api/*`).
- **Base de Datos Persistente:** Firebase Firestore 12.16.0 (colección de borradores `drafts` e historial de podcasts `history`).
- **Autenticación:** El cliente recibe un token desde un Hub externo y lo conserva en `localStorage`. El emisor/verificador no está definido en este repositorio; el token no es una identidad confiable hasta validarlo en servidor.
- **Servicio Servidor Admin:** `firebase-admin` 14.2.0 para operaciones con privilegios elevados en el servidor.

---

## 4. Herramientas de Compilación y Calidad de Código

- **Linter & Calidad:** ESLint 9.39.1 con configuración Next.js (`eslint-config-next`) y plugin de reglas de seguridad de Firebase (`@firebase/eslint-plugin-security-rules`).
- **Salida de producción:** Next.js standalone (`output: "standalone"`); `npm run build` prepara y valida `.next/standalone/server.js`, y `npm run start` lo ejecuta. El puerto se toma de `PORT` o usa 3000.
- **Runtime soportado:** Node.js 24.x y npm 11.x, declarados en `package.json`.
- **Calidad:** `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`; GitHub Actions ejecuta estos gates en Node 24.
