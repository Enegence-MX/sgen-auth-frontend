# SGEn Authentication Frontend

Frontend de SGEn conectado al backend NestJS actual: login, selección de organización, sesión y consulta/alta de organizaciones.

## Architecture

- Sesiones con cookies HttpOnly y CSRF; sin tokens en almacenamiento web.
- Renovación de sesión coordinada entre pestañas y rutas protegidas.
- Plataforma: listado, búsqueda, alta y detalle. Cliente: detalle de su organización y permisos.
- Consola de seguridad en `/security`: un superadministrador puede seleccionar una organización y consultar su política; solo el administrador de esa organización puede modificarla mediante el backend. La pestaña Usuarios y roles permite enviar invitaciones con roles reales; el listado de miembros y los cambios posteriores de roles aún no tienen endpoints. Proveedores de identidad, mapeo de grupos, auditoría, dominios y contexto de soporte siguen siendo demostrativos. El acceso al diálogo de contexto de soporte está en la cabecera de la consola.
- Activación pública por invitación en `/invitations/:token`: valida el enlace, crea una cuenta nueva o vincula una existente y aplica las reglas de contraseña y MFA devueltas por el backend. El MFA de correo se completa con código de un solo uso durante el inicio de sesión. No hay registro público.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS 4 mediante `@tailwindcss/vite`, CSS Modules e i18next (español/inglés)
- Base UI para tooltips, modales, notificaciones y selectores con búsqueda

## Local setup

The frontend is a separate project and runs as its own process, as in production. It needs the backend running first: follow the README of `sgen-auth-backend` (its `npm run dev` starts PostgreSQL, the API and Mailpit).

### 1. Requirements

Node.js 24 (`>=24.11 <25`, see `.nvmrc`).

### 2. Configure

```bash
cp .env.example .env
```

| Variable            | Default                        | Purpose                                                    |
| ------------------- | ------------------------------ | ---------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | Backend API. Must match `PORT` in the backend `.env`       |
| `FRONTEND_PORT`     | `5173`                         | Port of this frontend. If it is in use, Vite stops instead of choosing another one |

The backend must accept this address: `CORS_ORIGINS` and `FRONTEND_URL` in `sgen-auth-backend/.env` must be `http://localhost:<FRONTEND_PORT>`. Use `localhost` in both projects, not `127.0.0.1`, so the session cookies work.

### 3. Install and start

```bash
npm ci
npm run dev
```

On start it checks the backend and prints one of these lines:

```text
  ✓ Backend ready at http://localhost:3000/api/v1
  ⚠ Backend not reachable at http://localhost:3000/api/v1/health. Start it with npm run dev in sgen-auth-backend, or check VITE_API_BASE_URL in .env.
  ⚠ Backend at http://localhost:3000/api/v1 does not accept http://localhost:5180. Add it to CORS_ORIGINS and FRONTEND_URL in sgen-auth-backend/.env, or change FRONTEND_PORT here.
```

A warning does not stop Vite: fix it and reload the page.

### 4. Sign in

Use the platform superadmin created with `npm run platform:create-admin` in the backend, or the sample accounts of `npm run seed:dev` (password: `DEV_SEED_PASSWORD` in the backend `.env`). Invitation and MFA emails arrive in Mailpit (`http://localhost:8025`).

### Commands

| Command         | Purpose                               |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start Vite and check the backend      |
| `npm run check` | Lint, types, tests and build          |
| `npm run build` | Production build in `dist/`           |

## Organization

```text
src/
  app/             Rutas, pantallas, sesión compartida y composición de servicios
  features/auth/   API de autenticación, estado de sesión y tipos
  features/organizations/  API y tipos de organizaciones
  features/invitations/    API y tipos de invitaciones
  shared/          Transporte HTTP, traducciones, controles y estilos
  config/          Configuración pública del cliente
tests/             Regresiones de sesión, transporte, pantallas y traducciones
```

`app` compone las funcionalidades; `shared` no depende de ellas. Los componentes reciben servicios desde el contexto y las pruebas inyectan `fetch`.

## Style guide

Open `/styleguide` (locally, `http://localhost:5173/styleguide`) or use the **Guía de estilos** navigation entry. This independently loaded page needs no session, always uses Spanish and contains only sample data. Theme previews stay inside the guide and form examples do not call the API.

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

