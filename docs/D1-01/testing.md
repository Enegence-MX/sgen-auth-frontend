# D1-01 password flow verification

The frontend consumes the `PasswordState` returned by the backend. A session with
`changeRequired: true` is redirected from protected pages to `/password`. The page
loads the effective policy from `GET /api/v1/password/policy` and sends password
changes to `PUT /api/v1/password/change`.

## Automated checks

Run the full frontend gate with the Node.js version declared in `.nvmrc`:

```sh
npm ci
npm run check
```

This runs lint, TypeScript checks, Vitest and the production build. To run only the
password flow regressions:

```sh
npm run test -- tests/passwords.test.tsx
```

The regressions render the application router and use the real frontend services
with a simulated HTTP transport. They cover:

1. A required password change redirects `/organizations` to `/password` without
   requesting organization data. The effective policy shows no periodic expiration.
2. A successful change sends the exact entered values, including surrounding
   spaces, clears the local session and returns to `/login` with a success message.
   Protected pages remain unavailable until the user signs in again.
3. A mismatched confirmation shows a field error, makes no API request and keeps
   the authenticated session on `/password`.
4. A `PASSWORD_REUSED` response displays the translated error, preserves the
   session and entered values, and allows the user to retry.

The success regression also guards against a navigation race: clearing the local
session triggers the protected-route redirect. The password page commits its
login navigation synchronously so that redirect cannot discard the success
message stored in the navigation state.

These checks verify frontend behavior with simulated responses. Separate browser
verification on 2026-10-21 exercised the real NestJS backend, PostgreSQL password
history and session storage, and live HIBP requests. See the
[browser and backend evidence](evidence/2026-10-21/README.md) for the procedure,
results, screenshots and environment limits.

## Review notes

- English and Spanish `PASSWORD_CHECK_UNAVAILABLE` messages are included; the
  translation update is no longer pending.
- The branch includes the `develop` startup changes for `FRONTEND_PORT`, the
  backend/CORS check and `.npmrc`. Follow the current README for local startup.
- Desktop and mobile viewport checks passed in both light and dark themes against
  the running backend. Mobile coverage uses Chromium emulation, not a physical
  device. All four cases verified password history rejection, session revocation,
  sign-in with the new password and saved theme preferences.
