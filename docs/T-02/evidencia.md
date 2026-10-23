# T-02 · Evidencia del frontend

Alineación de `sgen-auth-frontend` con el contrato del backend (`sgen-auth-backend` PR #10, `docs/openapi.json`). Rama `feat/t-02-api-contract` desde `develop` (`3a1d2ed`).

## Cómo se valida el contrato

- `contract/openapi.json` es una copia del archivo del backend. `npm run contract:check` la compara con `../sgen-auth-backend/docs/openapi.json` y termina con código 1 si difieren; si el repo hermano no existe, se omite con un mensaje.
- `tests/support/contract-validator.ts` es el validador del backend (`test/support/contract-validator.mjs`) portado a TypeScript: ajv 8 + ajv-formats 3, esquemas cerrados (`additionalProperties: false`).
- El `fetch` de los fixtures valida **cada** solicitud contra su DTO y **cada** respuesta contra su esquema. `tests/setup.ts` hace fallar la prueba si hubo alguna violación.
- `tests/errors.test.tsx` lee los 42 `ErrorCode` del contrato y exige una traducción específica para cada uno, salvo `METHOD_NOT_ALLOWED`, `INTERNAL_ERROR` e `INVALID_DATABASE_ROLE`, que usan el mensaje genérico con la referencia de la solicitud.

## Cambios por bloque

| Bloque | Puntos | Resultado |
|---|---|---|
| Fixtures y contrato | F1, F2 | Fixtures con tipos `ENEGENCE_STAFF`/`CUSTOMER`, `language`/`theme` en `null`, `password`, módulo `SECURITY`, errores con `message` y `requestId` uuid, `mfa/verify` y refresh con sesión, `attemptsLeft`, estatus 403/429/503 correctos, handlers de `PATCH`, `suspend` y `reactivate`. Se quitó `/invitations/mfa/start` |
| Organizaciones | C1, C2 | Nombres del contrato sin capa de mapeo, `meta.pageSize`, opciones de la consola paginadas de 100 en 100 |
| Sesión | A1, A2, A3, A8 | Tres `accessMode`; uno desconocido se trata como `NO_CONTEXT` (solo aviso y cierre de sesión); `Identity` y `password` obligatorios; banner de expiración solo con `daysRemaining` |
| Errores | B1, B2 | `message` como respaldo para códigos fuera del contrato, detalles de `VALIDATION_FAILED` en el aviso, `requestId` solo en 5xx, 42 códigos traducidos |
| Comportamiento | A5, A7, B3, B5 | Intentos de MFA restantes, `MFA_CHALLENGE_INVALID` vuelve al correo, `PERMISSION_REQUIRED` vuelve a leer `/auth/me`, un reintento ante `CSRF_INVALID`, método `DELETE` en el cliente |
| Contraseñas, invitaciones, política y auditoría | D1–D4 | Límites desde `details`, invitación con campos obligatorios, política con solo los campos cambiados y caducidad 1–730 o `null`, etiqueta `taxAddress` |
| Federación | E1 | `HYBRID`, `FEDERATED` y el MFA federado se ven como «Próximamente» y no se envían |
| Estado | C6 | «Suspendida» / «Suspended» |
| Editar organización | C4 | Plataforma: tres campos; empresa con `MANAGE_ORGANIZATION_PROFILE`: sector y domicilio; solo cambios; «Limpiar sector» manda `null`; el domicilio no se puede vaciar |
| Suspender y reactivar | C5 | Solo plataforma, motivo obligatorio con contador, aviso de cierre de sesiones, 409 recarga el detalle |
| Extras | 11 | Cuenta regresiva del reto MFA, switch `mfaRequired` al crear organización (`requestId` en 5xx ya quedó en B1) |

## Resultados

- `npm run check`: lint, tipos, pruebas y build en verde. Pruebas: 71 en `develop`, 153 en la rama.
- `npm run contract:check`: la copia coincide con `sgen-auth-backend/docs/openapi.json` (`dae4264`). Con un archivo modificado termina con código 1.

## Pendiente

- Fixture de `PATCH /organizations/{id}/security-policy` hecho por la plataforma: el fixture responde 404 `ORGANIZATION_NOT_FOUND`. En el código del backend, `requireOwnTenant` llama primero a `requirePermission`, y `app.current_has_permission` solo es verdadero en `TENANT_USER`, así que la respuesta esperada es 403 `PERMISSION_REQUIRED`. Falta confirmarlo con una llamada real antes de cambiar el fixture. La UI no envía ese `PATCH` desde la plataforma.
- Prueba manual contra el backend real, capturas de escritorio y móvil, y revisión de temas claro y oscuro.
