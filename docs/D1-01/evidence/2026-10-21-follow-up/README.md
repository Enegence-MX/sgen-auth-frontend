# D1-01 review follow-up verification

The non-blocking frontend suggestions from the 2026-10-21 review are addressed in
`4163e5fbd65d979a1a0779a2a3d9ebb0134a7c7c`. This report records the checks after
those changes. The [earlier evidence](../2026-10-21/README.md) remains available as
a historical snapshot; the screenshots below show the current required-change
layout.

## Review changes

| Topic | Implementation |
| --- | --- |
| Controls rejected by the password gate | A required change uses a restricted layout without navigation, the user menu or settings controls. Saved language and theme still apply, and sign-out remains available. Optional changes retain the normal layout. The backend is unchanged. |
| Singular and plural text | English and Spanish catalogs use i18next `_one` and `_other` forms for expiration warnings, expiration exceptions, password history and character counts. |
| Repeated length limits | `PASSWORD_MIN_LENGTH` and `PASSWORD_MAX_LENGTH` are shared by the applicable invitation and security-settings constraints. Invitation hints receive the maximum as an interpolation parameter. The password page still reads its effective policy from the backend. |
| Unused translations | Removed `securityConsole.recommendedLength` and `securityConsole.meetsRecommendation` from both catalogs. |

The review's backend question about future federated sign-in remains outside this
frontend change and should be considered in the federated-authentication work.

## Automated verification

`npm ci` and `npm run check` completed successfully on Node.js 24.21.0. All four
lint stages, TypeScript, 71 tests in seven files and the production build passed.
The existing Vite chunk-size warning remains.

Six tests were added: required-change controls and sign-out, optional-change
navigation and settings, and four language/count combinations covering English
and Spanish singular/plural messages. Before the implementation, the restricted
layout test and both singular-language cases failed. They pass with the fix.

## Real-backend browser verification

The browser run used Chromium 153.0.8010.12, the real NestJS backend at
`3c867625a1fbc1a8412481077742454e2e710287`, a temporary PostgreSQL 18 cluster with
actual migrations, and `PASSWORD_BREACH_CHECK=hibp`. The accounts and organization
were synthetic. HTTP responses were not simulated or intercepted. No passwords,
authentication tokens or database credentials are included in the evidence.

All four cases in the [machine-readable results](verification-results.json)
passed: desktop at 1440 by 1000 and mobile at 390 by 844, each in light and dark
themes. Mobile coverage uses Chromium viewport emulation, not a physical device.

Each case verified that:

1. A required change redirects to `/password`, with navigation, the user menu and
   settings controls absent. The sign-out button is visible.
2. Sign-out works while a change is required; a fresh sign-in returns to the
   required-change page.
3. Mismatched confirmation sends no change request. A prior password returns
   HTTP 422 `PASSWORD_REUSED` and leaves both active sessions available.
4. A valid change returns HTTP 200 and redirects to sign-in with the success
   message intact. Authentication cookies are cleared.
5. Both active sessions are closed with `CREDENTIAL_CHANGED`. The independent old
   session receives HTTP 401, and protected navigation returns to sign-in.
6. The previous password is rejected; the new password signs in successfully and
   `changeRequired` becomes false.
7. After the password change, theme settings save through the real API and survive
   a reload. No browser page errors or horizontal overflow occur in captured states.

All eight live HIBP requests returned HTTP 200. The new required-change and error
screenshots were visually inspected for readable fields, messages and sign-out
controls in all four viewport/theme combinations.

| Viewport and theme | Required change | History rejection | Success at sign-in | New-password sign-in |
| --- | --- | --- | --- | --- |
| Desktop, light | [Screenshot](desktop-light-required.png) | [Screenshot](desktop-light-reused.png) | [Screenshot](desktop-light-success.png) | [Screenshot](desktop-light-signed-in.png) |
| Desktop, dark | [Screenshot](desktop-dark-required.png) | [Screenshot](desktop-dark-reused.png) | [Screenshot](desktop-dark-success.png) | [Screenshot](desktop-dark-signed-in.png) |
| Mobile, light | [Screenshot](mobile-light-required.png) | [Screenshot](mobile-light-reused.png) | [Screenshot](mobile-light-success.png) | [Screenshot](mobile-light-signed-in.png) |
| Mobile, dark | [Screenshot](mobile-dark-required.png) | [Screenshot](mobile-dark-reused.png) | [Screenshot](mobile-dark-success.png) | [Screenshot](mobile-dark-signed-in.png) |

To repeat the browser checks, follow the
[isolated-environment procedure](../2026-10-21/README.md#repeating-the-browser-checks),
also checking the absence of navigation/settings and exercising sign-out before
the password change. `npm run check` covers the simulated-transport regressions;
the live browser run used a separate temporary Playwright harness. Physical
devices, other browser engines and production were not tested.
