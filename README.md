# SGEn Authentication Frontend

Frontend de SGEn conectado al backend NestJS actual: login, selección de organización, sesión y consulta/alta de organizaciones.

## Architecture

- Sesiones con cookies HttpOnly y CSRF; sin tokens en almacenamiento web.
- Renovación de sesión coordinada entre pestañas y rutas protegidas.
- Plataforma: listado, búsqueda, alta y detalle. Cliente: detalle de su organización y permisos.
- Sin registro público. MFA, federación e invitaciones siguen pendientes en backend.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS 4 mediante `@tailwindcss/vite`, CSS Modules e i18next (español/inglés)
- Base UI para tooltips, modales, notificaciones y selectores con búsqueda

## Environment Setup

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` apunta a `http://localhost:3000/api/v1`. Usar `localhost` en ambos servicios y autorizar el origen del frontend en `CORS_ORIGINS`.

## Installation

Node.js 24:

```bash
npm ci
```

## Running the application

Desde la raíz del proyecto (`cd ..`), Docker levanta frontend, backend y PostgreSQL juntos:

```bash
npm run dev
npm run dev:logs
npm run dev:down
```

Frontend: `http://localhost:5173` por defecto. Este entorno usa `http://localhost:5175`, configurado con `FRONTEND_PORT` en `sgen-auth-backend/.env.development.local`.

Para ejecutar sólo Vite desde este repositorio: `npm run dev`. Para validar: `npm run check` (lint, tipos, pruebas y build).

Cuentas locales: `platform@example.test` (alta/listado), `admin.alpha@example.test`, `admin.beta@example.test`, `shared@example.test` (selector de organización) y `suspended@example.test` (acceso rechazado). Contraseña: valor de `DEV_SEED_PASSWORD` en `sgen-auth-backend/.env.development.local`; no se incluye en el frontend.

## Organization

```text
src/
  app/             Rutas, pantallas, sesión compartida y composición de servicios
  features/auth/   API de autenticación, estado de sesión y tipos
  features/organizations/  API y tipos de organizaciones
  shared/          Transporte HTTP, traducciones, controles y estilos
  config/          Configuración pública del cliente
tests/             Regresiones de sesión, transporte, pantallas y traducciones
```

`app` compone las funcionalidades; `shared` no depende de ellas. Los componentes reciben servicios desde el contexto y las pruebas inyectan `fetch`. Contrato y documentos locales: `../Docs/backend/`.

## Style guide

Open `/styleguide` (locally, `http://localhost:5175/styleguide`) or use the **Guía de estilos** navigation entry. This independently loaded page needs no session, always uses Spanish and contains only sample data. Theme previews stay inside the guide and form examples do not call the API.

The sidebar groups sections and follows the section visible while scrolling. Escape closes the mobile navigation. The mobile sidebar can be hidden and the desktop sidebar collapses to icons.

Theme controls stay at the bottom of the sidebar, including its collapsed state. The header previews the reusable `UserMenu` with sample session data and local settings/sign-out feedback. Pass translated labels, user details and action callbacks when reusing it; the component itself does not call authentication services.

- `src/shared/styles/tokens.css` remains the source of brand colors, fonts, radii and light/dark themes.
- Feedback colors are distinct: `positive` for success, `caution` for warnings, `negative` for errors, and `brand-soft` for information and selection. `Notice` and `Badge` expose separate `warning` and `error` variants. Shared controls use 10 px corners, cards use 20 px, and control/card/overlay elevations have separate tokens.
- `src/shared/styles/tailwind.css` maps those tokens to semantic utilities: `bg-brand`, `bg-panel`, `text-ink`, `text-body`, `border-line`, `rounded-control` and `rounded-card`.
- Reuse `Button`, `TextField`, `TextArea`, `SelectField`, `Checkbox`, `Radio`, `Switch`, `Table`, `Notice`, `Card` and `Badge` from `shared/ui`. They use Tailwind with the shared palette. `Radio` is exported from `Checkbox.tsx`. Keep complete class names in source so Tailwind can detect them.
- Form controls preserve native labels, keyboard interaction, disabled fieldsets, form submission and reset. Supply `hint` or `error` to text/select fields for linked descriptions. `Table` takes a `caption` and native table children; its container scrolls horizontally on narrow screens.
- `Pagination` is controlled through `page`, `pageCount` and `onPageChange`, with translated labels, numbered/compact variants and optional `controls` pointing to the paginated content. Page numbers start at 1; a zero page count disables navigation. The guide shows local table pagination and a page-size selector that resets to the first page.
- `DataChart` wraps Chart.js with `react-chartjs-2` for line/area, bar, doughnut and radar charts. Pass category `labels`, numeric `series`, a descriptive `label` and translated `controls`. It reads the enclosing theme tokens, resizes with its container and respects reduced motion. Keyboard-operable legends toggle series or doughnut segments; **Ver datos** exposes the original values in a native table. Only the required Chart.js controllers are registered, and the guide examples load in a separate chunk.
- `Tabs` provides underlined and segmented variants using Base UI keyboard navigation. `DropdownMenu` composes action items, checkbox items, groups and separators inside the current overlay theme. `Spinner`, `Skeleton` and `Progress` provide loading states with reduced-motion fallbacks; pass `null` for indeterminate progress. Skeletons are decorative: mark their content region `aria-busy` and announce loading outside that region, as in the guide example.
- `Tooltip`, `Modal`, `ToastProvider`/`useToasts` and `SearchSelect` wrap Base UI with the same Tailwind tokens. Wrap a locally themed surface in `OverlayProvider` so portals inherit its theme; elsewhere they use the document theme. Place `ToastProvider` inside that provider and supply translated labels. Modals are controlled and restore focus to their trigger. `SearchSelect` accepts controlled single or multiple values, filters option labels and submits option IDs through `name`; Escape preserves the selection. Selection updates and resets belong to the parent form.
- Existing page/layout CSS Modules remain available for gradual migration. Preflight is omitted to preserve the existing document defaults; the document base is in `@layer base` so utility classes can override it. Declare border styles explicitly, for example `border border-solid border-line`.
- For responsive layouts, start with `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`. Test narrow screens as well as desktop.

After changing dependencies, rebuild the Docker frontend from the workspace root: `docker compose --env-file sgen-auth-backend/.env.development.local up -d --build --no-deps frontend`.
