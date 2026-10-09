# Manual de Operaciones y Guía de Usuario - SourceFinder Pod v0.1.0

## 1. Visión General de la Aplicación
**SourceFinder Pod** es una plataforma integral de inteligencia automatizada y generación de podcasts convocada por **Conecta Chava** y **VSNRY LABS**. Permite investigar tendencias globales en tiempo real mediante búsquedas verificadas con Google Search Grounding, calificar la reputación de las fuentes, construir guiones radiofónicos dinámicos con múltiples locutores/callers y sintetizar voz multilocutor mediante Gemini TTS.

---

## 2. Requisitos y Configuración de Entorno

### Requisitos Previos
- Node.js 24.x y npm 11.x (versiones declaradas en `package.json`).
- Clave de API de Gemini (`GEMINI_API_KEY`).
- Proyecto de Firebase provisionado para Firestore.

### Variables de Entorno (`.env.example`)
Asegúrate de contar con el archivo `.env` configurado en la raíz del proyecto:
```env
GEMINI_API_KEY=[TU_CLAVE_GEMINI_API]
NEXT_PUBLIC_FIREBASE_API_KEY=[TU_FIREBASE_API_KEY]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[TU_PROYECTO.firebaseapp.com]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[TU_PROYECTO_ID]
```

---

## 3. Comandos de Ejecución y Despliegue

```bash
# Instalación reproducible
npm ci

# Modo de Desarrollo
npm run dev

# Verificación de Código y Linter
npm run lint

# Verificación de tipos
npm run typecheck

# Compilación para Producción
npm run build

# Iniciar Servidor de Producción
npm run start
```

`npm run build` prepara y valida `.next/standalone/server.js`; `npm run start` ejecuta ese artefacto. El servidor escucha en `PORT` cuando el entorno lo define y, de lo contrario, en el puerto 3000.

La auditoría de dependencias se ejecuta con `npm audit --audit-level=high`. No uses `npm audit fix --force` sin revisar cambios de versión mayor y pruebas de regresión. Las credenciales van en variables de entorno; no se agregan al repositorio.

---

## 4. Estructura de Navegación e Interfaz

La aplicación se organiza en una arquitectura modular de pestañas e instrumentos interactivos:

1. **Landing (Inicio):** Presentación ejecutiva del sistema con llamada a la acción para iniciar el estudio.
2. **Orchestration (Orquestador):** Control central para ejecutar todo el flujo en un solo clic (Investigación -> Guion -> Storyboard).
3. **SourceFinder (Investigación):** Búsqueda de noticias de última hora o análisis de tendencias generales ("TENDENCIAS"). Permite ajustar umbrales de confianza (0.0 - 1.0) y clasificar fuentes verificadas vs. rechazadas.
4. **Script Studio (Estudio de Guion):** Editor de guiones en tiempo real.
   - **Smart Refine:** Botón de pulido con IA que corrige gramática y fluidez conversacional.
   - **Focus Mode:** Modo de lectura inmersiva sin distracciones.
5. **Podcast Studio (Estudio de Voz y Carátulas Imagen):**
   - **Reproductor y Síntesis Multivoz:** Reproductor de audio multilocutor con etiquetas de sentimiento (Entusiasta, Neutro, Preocupado), barras de estado de voz, pausas inteligentes y generación por lote con Gemini TTS.
   - **Estudio de Carátulas con Imagen (`ImagenCoverStudio`):** Herramienta integrada en el flujo del Podcast Studio que utiliza modelos Imagen (`imagen-3.0-generate-002` / `imagen-4.0-generate-001`) y `gemini-3.1-flash-lite-image` (con respaldo vectorial determinista) para diseñar carátulas personalizadas por estilo artístico, paleta cromática, relación de aspecto (`1:1`, `16:9`, `9:16`) y extracción de concepto visual desde el guion.
   - **Asignación de Voces Clonadas (`VoiceClone`):** Selector por locutor para vincular perfiles de voz personalizados creados en el panel de usuario.
6. **Storyboard (Visuales Flow):** Vista gráfica con desglose de escenas de video de 5-15 segundos, prompts hiperrealistas para locutores y sugerencias de planos B-Roll.
7. **Métricas & Retención (`DashboardView`):** Panel analítico basado en Recharts para visualizar tasa de retención estimada, tiempo promedio de escucha, crecimiento por audiencia y simulador de longitud de guion.
8. **Documentación (Docs):** Visor integrado de la arquitectura y guías del sistema.

---

## 5. Módulos Adicionales y Herramientas

- **Voice Clone IA (`components/VoiceClone.tsx`):** Componente disponible en el panel del usuario (pestaña *Voice Clone*) y en el Podcast Studio para subir o grabar muestras de audio (5-30s), analizar frecuencia fundamental y timbre mediante Web Audio API, calibrar parámetros (`pitchShift`, `speed`, `warmth`, motor base Gemini TTS) y asignar perfiles clonados directamente al elenco del Podcast Studio.
- **Autoguardado en Firestore:** Sincronización con debounce de 3 segundos cuando existe una sesión autenticada de Firebase (`request.auth != null`). La página de inicio (`Landing`) y el estudio se cargan sin redirección automática a `gs.conectachava.com`.
- **Modo Temático Flexible (`useThemeConfig`):** Selector en el perfil de usuario que permite elegir entre **Siempre Claro** (`light`), **Siempre Oscuro** (`dark`) o **Sincronizar con Sistema** (`system`), con transición fluida mediante las variables CSS definidas en `app/globals.css`.
- **Exportación de Proyecto:** Descarga de informes, guiones y storyboards en formato JSON, Markdown y TXT.
- **Historial Reciente:** Cajón de proyectos anteriores guardados en Firestore para recargar sesiones previas.
- **Atajos de Teclado:**
  - `Ctrl + S` / `Cmd + S`: Sincronización manual en Cloud.
  - `Ctrl + Enter` / `Cmd + Enter`: Avanzar a la siguiente fase del pipeline.

El callback conserva el token recibido del Hub, pero no lo valida. Las funciones que necesitan un usuario autenticado de Firebase, como el historial y la sincronización en Firestore, no deben considerarse operativas para ese flujo hasta integrar verificación server-side.

---

## 6. Solución de Problemas Frecuentes

1. **"GEMINI_API_KEY environment variable is not set":**
   - Asegúrate de definir `GEMINI_API_KEY` en tu entorno o panel de configuración. En ausencia de la clave, el sistema activará automáticamente los motores de reserva offline (*fallbacks*).
2. **Desconexión con Firestore:**
   - La aplicación detecta automáticamente la pérdida de conectividad a Internet y conmuta a la memoria caché local sin perder el progreso del usuario. Se enviará un aviso emergente (*Toast*) cuando se restablezca la conexión.

## 7. Estado de seguridad conocido

- El token de callback del Hub se guarda en `localStorage`. El repositorio aún no documenta el emisor ni un verificador server-side compatible para ese token. No debe considerarse autenticación verificada ni usarse para decisiones de autorización.
- Las rutas API deben validar autenticación y autorización en el servidor antes de exponerse en producción. El filtro de `User-Agent` no autentica solicitudes.
- Las reglas de Firestore son una frontera independiente; una autorización visual en React no sustituye las reglas ni la verificación de identidad.
- Consulta [SECURITY.md](../SECURITY.md) para riesgos conocidos y proceso de reporte.
