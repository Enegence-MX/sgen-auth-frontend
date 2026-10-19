# T-01 · Evidencia del arranque local (frontend)

Comprobación del procedimiento del README el 19 de octubre de 2026, con el backend de la rama del PR #7 de `sgen-auth-backend` corriendo en `http://localhost:3000` y `CORS_ORIGINS=http://localhost:5173`. La evidencia del backend, PostgreSQL y Mailpit está en `sgen-auth-backend/docs/T-01/evidencia.md`.

- **Entorno:** Node 24.21, Vite 8.3.
- Se omiten las líneas `Network` y `press h` de Vite.

## Resumen contra los criterios de aceptación

| Criterio | Resultado | Escenario |
|---|---|---|
| El frontend arranca con scripts y variables vigentes | ✅ `cp .env.example .env`, `npm ci` y `npm run dev`. Ya no depende del lanzador de la raíz | 1 |
| Puerto configurable y el frontend apunta al backend de SGEn | ✅ `FRONTEND_PORT` y `VITE_API_BASE_URL`; al arrancar se comprueba que el backend responde y acepta el origen del frontend | 1, 2 |
| Fallos comprensibles | ✅ Backend apagado, origen no aceptado, puerto ocupado, puerto inválido y versión de Node incorrecta | 2 a 6 |
| Procedimiento documentado | ✅ Sección *Local setup* del README | — |

## 1. Arranque normal

```text
$ cp .env.example .env
$ npm ci
$ npm run dev
  VITE v8.3.1  ready in 135 ms
  ➜  Local:   http://localhost:5173/
  ✓ Backend ready at http://localhost:3000/api/v1
```

✅ El backend responde `GET /api/v1/health` y acepta `http://localhost:5173` en CORS.

## 2. Puerto que el backend no acepta

```text
$ FRONTEND_PORT=5180 npm run dev
  ➜  Local:   http://localhost:5180/
  ⚠ Backend at http://localhost:3000/api/v1 does not accept http://localhost:5180. Add it to CORS_ORIGINS and FRONTEND_URL in sgen-auth-backend/.env, or change FRONTEND_PORT here.
```

✅ Detecta el error local más común: cambiar el puerto del frontend sin cambiar `CORS_ORIGINS`. Sin esta comprobación, el login fallaba en el navegador sin explicación.

## 3. Backend apagado o URL incorrecta

```text
$ VITE_API_BASE_URL=http://localhost:3999/api/v1 npm run dev
  ➜  Local:   http://localhost:5173/
  ⚠ Backend not reachable at http://localhost:3999/api/v1/health. Start it with npm run dev in sgen-auth-backend, or check VITE_API_BASE_URL in .env.
```

✅ Vite sigue arrancando; basta con corregir y recargar.

## 4. Puerto ocupado

```text
$ (otro proceso escucha en 5173)
$ npm run dev
error when starting dev server:
Error: Port 5173 is already in use
```

✅ Se detiene en lugar de tomar otro puerto en silencio, que no coincidiría con `CORS_ORIGINS` ni con `FRONTEND_URL` (los enlaces de invitación) del backend.

## 5. Puerto inválido

```text
$ FRONTEND_PORT=abc npm run dev
error when starting dev server:
Error: FRONTEND_PORT must be an integer between 1 and 65535.
```

✅

## 6. Versión de Node incorrecta

```text
$ (Node 22) npm ci
npm error code EBADENGINE
npm error notsup Required: {"node":">=24.11.0 <25"}
npm error notsup Actual:   {"npm":"10.9.9","node":"v22.23.3"}
```

✅ Con `engine-strict` en `.npmrc`, npm se detiene; antes solo mostraba una advertencia. El backend aplica la misma restricción (PR #7).

## Pruebas automáticas

`npm run check`: lint, tipos, 61 pruebas (incluidas las de `tests/backend-check.test.ts`: puerto por defecto y configurado, puertos inválidos, backend listo, apagado, URL incorrecta y origen no aceptado) y build.
