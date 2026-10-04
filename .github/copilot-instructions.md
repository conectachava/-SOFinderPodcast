# Instrucciones de GitHub Copilot para SOFinder Podcast

Estas instrucciones aplican solo a este repositorio. Basa cada cambio en el código y configuración actuales; contrasta los informes y documentación con la evidencia local.

## Contexto verificado

- Aplicación Next.js con React; `package.json` declara Next `^16.3.6`, React `^19.2.8`, Node `24.x` y npm `11.x`.
- `package.json` declara salida `standalone`; `npm start` ejecuta `.next/standalone/server.js`. Las rutas API están en `app/api/`.
- Rutas observadas incluyen orquestación, búsqueda de fuentes, escritura/refinamiento de guiones, storyboard, resumen, TTS, arte de portada, metadatos, exportación y feedback.
- El repositorio usa Firebase cliente y Firebase Admin. Las variables públicas `NEXT_PUBLIC_FIREBASE_*` no deben contener credenciales privadas.
- `lib/vertex-ai.ts` elige Vertex AI según `USE_VERTEX_AI`/`VERTEX_AI` o cuando no detecta una API key Gemini válida; la configuración de proyecto y región tiene valores fallback en código. Verifica el entorno real antes de asumir el proveedor, proyecto, región o identidad IAM activa.
- `.env.example` lista `GEMINI_API_KEY`, credenciales de Firebase Admin y opciones de Vertex AI, además de configuración pública Firebase. No copies valores reales en código, logs ni documentación.
- Scripts disponibles: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run clean`. `vitest.config.ts` configura Vitest.
- Existe `AGENTS.md` con instrucciones del repositorio. Evita crear reglas paralelas que lo contradigan o dupliquen.

Este contexto deriva de archivos del repositorio y puede cambiar. Compruébalo antes de usarlo como contrato.

## Forma de trabajo

- Empieza por el archivo, símbolo, flujo o error indicado. Inspecciona manifiestos, instrucciones, estado de Git y consumidores relacionados antes de editar.
- Conserva cambios preexistentes; no reviertas ni sobrescribas trabajo fuera del alcance.
- Reutiliza patrones y helpers existentes cuando sus contratos coincidan. Cambia de forma precisa y tipada, corrigiendo la causa raíz.
- Distingue evidencia de inferencia y marca lo no verificado como `UNKNOWN`, `NOT_RUN` o `NOT_AVAILABLE`.
- No generes auditorías, artefactos, pruebas de cada función ni troubleshooting para tareas rutinarias si no son pertinentes.
- No hagas commit, push, despliegue, publicación, rotación de credenciales ni acciones destructivas sin autorización explícita.

## Seguridad y operaciones con IA

- Mantén credenciales privadas y privilegios del lado servidor. Una variable `NEXT_PUBLIC_*` es configuración pública y puede terminar en el cliente.
- Integra el asistente común de Google Conversational Agents (CES) como llamada backend a `runSession`, nunca desde componentes cliente. La cURL con `gcloud auth print-access-token` sirve para una comprobación manual autorizada, no para producción.
- Mantén project/location/app/app-version/deployment CES en configuración privada de servidor por entorno/app, sin hardcodear IDs del ejemplo ni un session ID estático. En producción obtén access tokens efímeros mediante ADC/identidad de workload o la biblioteca Google aprobada; no ejecutes `gcloud` desde el servicio.
- Verifica el contrato de creación, propiedad, reutilización y expiración de sesiones; liga la sesión del proveedor al usuario autenticado y evita que un usuario consulte la conversación de otro. Aplica validación, límites de uso, timeouts, cancelación y redacción de logs.
- Revisa versión del API, ubicación, permisos mínimos, retención y configuración desplegada. La existencia de una ruta o variables no prueba integración operativa; comprueba el flujo con pruebas y entorno autorizado.
- Antes de alterar llamadas de Gemini/Vertex, verifica el grafo de importación y ejecución para confirmar dónde corre el código y qué configuración de proveedor aplica en cada entorno.
- Valida en servidor autenticación, autorización, entradas, permisos por recurso y parámetros permitidos antes de llamadas costosas. No confíes en roles o límites que existan solo en cliente.
- Usa límites de tamaño, frecuencia, concurrencia, timeout y costo proporcionales al flujo. No inventes cuotas, precios, límites de proveedor ni garantías FinOps.
- No registres tokens, claves, prompts completos, información personal ni payloads sensibles. Redacta errores de proveedores antes de registrarlos.
- Trata integraciones internas, tokens, headers y endpoints como límites de confianza que deben verificarse; no consideres secreto un valor solo porque se envía en un header interno.
- `app/callback/page.tsx` recibe `token` por query string y lo guarda en `localStorage`; `ProtectedRoute` considera autenticada cualquier sesión con ese valor presente. Esto no verifica identidad ni autoriza APIs. gsConectaOS aún no tiene verificado el handoff OIDC y su `/api/auth/verify` depende de issuer, audience, claves y allowlist aún no configurados.
- No uses tokens de URL o `localStorage` como prueba de identidad. El SSO futuro debe usar OIDC Authorization Code + PKCE, `state`/`nonce`, redirect URI exacta, código efímero de un solo uso y validación server-side; verifica autorización por recurso después de autenticar.

## Pruebas, documentación y respuesta

- Ejecuta primero la validación más estrecha aplicable. Usa los scripts definidos en `package.json`; `npm run lint` es ESLint y `npm run typecheck` es TypeScript.
- Para cambios de comportamiento o seguridad, agrega pruebas negativas y de límites relevantes, y confirma que Vitest descubra y ejecute las pruebas. Reporta resultados reales.
- No declares auditoría de dependencias, escaneo de secretos, CI remoto, Vertex/IAM, Firestore o despliegue comprobados si no se ejecutó una validación apropiada.
- En revisiones amplias, comprueba si existe `README.md` y si documenta propósito, arquitectura, requisitos, configuración segura y comandos reales. Actualízalo si está desalineado o créalo cuando sea necesario para operar el proyecto.
- `AGENTS.md` ya existe y es opcional en nuevas apps: actualízalo solo si cambian sus reglas específicas. Evita duplicar allí las instrucciones activas de Copilot.
- Mantén una única fuente activa de instrucciones de Copilot en `.github/copilot-instructions.md`; actualiza solo documentación afectada.
- Para tareas normales, resume cambios y validaciones. Para auditorías solicitadas, informa alcance, hallazgos priorizados, evidencia, validaciones y riesgos residuales; no presentes una revisión de código como certificación o aprobación de producción.
