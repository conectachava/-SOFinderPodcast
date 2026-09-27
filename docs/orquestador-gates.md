# Gates de Orquestación

## Flujo implementado

`components/OrchestratorView.tsx` envía la solicitud a `POST /api/orchestrator`. El endpoint ejecuta SourceFinder y ScriptWriter en secuencia; valida el informe y el guion con esquemas Zod; después intenta generar storyboard y portada como pasos opcionales. La respuesta final se valida con `OrchestratorResponseSchema` antes de entregarse a la interfaz.

Los esquemas de salida principales exigen un informe y un guion de al menos 50 caracteres. Las validaciones reutilizables de temas, líneas de guion y transiciones de estado están en `lib/pipeline-validator.ts`, con pruebas en `__tests__/pipeline-validator.test.ts`.

SourceFinder aplica un limitador de 10 solicitudes por intervalo de 15 minutos en `app/api/source-finder/route.ts` y clasifica dominios con `config/reputation-map.json`. Ese limitador vive en memoria del proceso; no es un límite global distribuido entre instancias.

## Dependencias y comandos

Zod y `limiter` ya están declarados en `package.json`. Instala el conjunto bloqueado de dependencias, no paquetes sueltos:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

## Límites de seguridad

`withAiApiValidation` agrega cabeceras y rechaza algunos `User-Agent` de escáneres. No autentica usuarios y no sustituye autorización, protección contra abuso ni límites de coste. La identidad del token recibido desde el Hub aún no se verifica en servidor; las rutas API deben considerarse accesibles directamente mientras ese contrato no se integre.

Firestore conserva sus reglas independientes en `firestore.rules`. La reputación de dominio es una señal de clasificación y no una prueba de veracidad editorial. El análisis de riesgos y las condiciones para producción están en `SECURITY.md`.