# Diagramas y Flujos de Datos del Sistema - SourceFinder Pod v0.1.0

Este documento detalla la lógica de flujo de datos, la canalización multiagente y la arquitectura de estado de la aplicación.

---

## 1. Flujo Completo del Pipeline de Orquestación

```
[Usuario solicita tema / Presión de Botón]
                      │
                      ▼
         /api/orchestrator (Route)
                      │
     ┌────────────────┴────────────────┐
     ▼                                 ▼
1. /api/source-finder           2. /api/script-writer
 - Real-Time Trends Search       - Toma informe de inteligencia
 - Grounding Chunks Analysis     - Aplica formato (Debate/Análisis/Opinión)
 - Domain Reputation Rating      - Genera diálogo Moderador + Callers
 - Qualified vs Rejected         - Infiere timestamps y sentimientos
     │                                 │
     └────────────────┬────────────────┘
                      │
                      ▼
            3. /api/storyboard
             - Convierte guion en escenas de video
             - Prompts para Flow Video (B-Roll / Talking Heads)
             - Genera descripciones hiperrealistas de personajes
                      │
                      ▼
   [Respuesta JSON Consolidada enviada a la UI Frontend]
```

---

## 2. Flujo de Calificación de Fuentes en SourceFinder

```
  [Google Search Grounding Chunks]
                 │
                 ▼
     Extracción de Dominio URL
                 │
                 ▼
  getDomainReputation(urlStr)
  ├── Dominios Noticias Top (BBC, Reuters, AP, Bloomberg): 0.95
  ├── Dominios Tech/Prensa (Wired, The Verge, TechCrunch): 0.92
  ├── Entretenimiento (Variety, People, TMZ): 0.82
  ├── Referencia/Académico (Wikipedia, GitHub, Nature): 0.88
  ├── Redes/Comunidad (Reddit, Medium, Substack): 0.55
  └── Blogs no verificados / Dominios dudosos: 0.20-0.25
                 │
                 ▼
  ¿Reputación >= minReputation (ej. 0.70)?
         ├── SÍ ──> Añadir a qualifiedSources[]
         └── NO ──> Añadir a rawSources[] con rejection_reason
```

---

## 3. Flujo de Parsing de Guion y Detección de Sentimiento

```
           [Respuesta Textual de Gemini]
                         │
                         ▼
             Sintaxis "Nombre: Texto"
                         │
                         ▼
        Procesamiento de Etiquetas [Etiqueta]
  ├── Extrae Género ([Female] / [Male])
  ├── Extrae Acento ([Accent: American Midwest])
  ├── Extrae Sentimiento explícito ([Sentiment: enthusiastic])
  └── Limpia etiquetas del texto locutado
                         │
                         ▼
          Detección de Sentimiento Implícito
  ├── Entusiasta: Palabras clave (excelente, fascinante, éxito...)
  ├── Preocupado: Palabras clave (riesgo, alerta, duda, problema...)
  └── Neutro: Resto de frases
                         │
                         ▼
      Cálculo de Tiempos y Estampa Temporal
  ├── Conteo de palabras / 2.2 palabras por segundo
  └── Generación de timestamp acumulativo ("0:00", "0:15", "0:42")
```

---

## 4. Flujo de Sincronización en la Nube y Autosave

```
[Edición de usuario en UI (Reporte/Guion)]
                    │
                    ▼
          Debounce de 3 Segundos
                    │
                    ▼
     ¿Existe identidad verificada por Firebase?
       ├── SÍ ──> Firestore aplica sus reglas por UID
       └── NO ──> Estado local; no se debe autorizar escritura en la nube
                    │
                    ▼
    Notificador UI de Sincronización ("Guardado")
```

  La interfaz principal e inicio (`Landing`) se cargan directamente sin redirección forzada al dominio externo `gs.conectachava.com`. El inicio de sesión interactivo utiliza Firebase Authentication (`signInWithPopup` con proveedor Google), mientras que el token del callback del Hub (si se recibe) no establece por sí mismo un usuario autenticado ni privilegios hasta contar con verificación server-side; véase [SECURITY.md](../SECURITY.md).
