# D1-01 browser and backend verification

All four pending review checklist items were completed on 2026-10-21: English
Conventional Commit messages, desktop/mobile screenshots, light/dark theme checks
and verification against the real backend.

## Environment

- Frontend application revision: `20eb7999674900234925ba28ffca9f95ee67f39f`.
  The evidence update changes documentation only.
- Backend revision: `3c867625a1fbc1a8412481077742454e2e710287`, from `develop`
  after backend PR #6 was merged.
- Node.js 24.21.0, PostgreSQL 18 and Chromium 153.0.8010.12 through Playwright.
- A separate local NestJS process, temporary PostgreSQL cluster and the actual
  database migrations. Browser requests used the real HTTP API without simulated
  responses or intercepted routes. `PASSWORD_BREACH_CHECK=hibp` enabled live HIBP.
- Four synthetic identities in the fictional Manufacturas Encinos organization,
  each with a current password, a prior password in history and a required change.
  Passwords, cookies, tokens and database credentials are excluded from this report.

The desktop viewport was 1440 by 1000. The mobile viewport was 390 by 844 with touch
and mobile emulation. Screenshots capture the full page, so their height can exceed
the viewport. These checks cover local Chromium; they do not establish physical
device, Safari, Firefox or production-environment behavior.

## Results

`npm ci` completed, then `npm run check` passed on 2026-10-21: all four lint
stages, TypeScript checks, 65 tests across seven files and the production build.
The build retained the existing warning about chunks exceeding 500 kB.

The [machine-readable results](verification-results.json) record all four passing
cases. Every case verified the following behavior:

1. Signing in with `changeRequired: true` redirects to `/password`. The effective
   policy explicitly displays no periodic expiration.
2. A mismatched confirmation displays a field error and sends no password-change
   request.
3. Submitting a prior password returns HTTP 422 with `PASSWORD_REUSED`. The error
   is visible and both existing sessions remain active.
4. Submitting a new password returns HTTP 200 and redirects to `/login`, retaining
   the success message and clearing the browser's authentication cookies.
5. The database records both sessions as closed with `CREDENTIAL_CHANGED`. An
   independent browser session receives HTTP 401 from `/auth/me` and returns to
   sign-in when opening a protected page.
6. The previous password cannot sign in. The new password can sign in and open the
   organization page; the backend policy then reports `changeRequired: false`.
7. Switching the theme and switching back both save through the actual settings
   API. Reloading preserves the selected theme.
8. No browser page errors or horizontal document overflow occur at the captured
   states. Visual inspection confirms readable fields, policy text, error and
   success messages in both themes and viewport sizes.

The completed run made eight live HIBP requests; all returned HTTP 200. Eight
sessions were revoked across the four cases, two per case. Only request counts and
status codes are retained; no HIBP query prefixes or response contents are stored
in the evidence.

| Viewport and theme | Required change | History rejection | Success at sign-in | New-password sign-in |
| --- | --- | --- | --- | --- |
| Desktop, light | [Screenshot](desktop-light-required.png) | [Screenshot](desktop-light-reused.png) | [Screenshot](desktop-light-success.png) | [Screenshot](desktop-light-signed-in.png) |
| Desktop, dark | [Screenshot](desktop-dark-required.png) | [Screenshot](desktop-dark-reused.png) | [Screenshot](desktop-dark-success.png) | [Screenshot](desktop-dark-signed-in.png) |
| Mobile, light | [Screenshot](mobile-light-required.png) | [Screenshot](mobile-light-reused.png) | [Screenshot](mobile-light-success.png) | [Screenshot](mobile-light-signed-in.png) |
| Mobile, dark | [Screenshot](mobile-dark-required.png) | [Screenshot](mobile-dark-reused.png) | [Screenshot](mobile-dark-success.png) | [Screenshot](mobile-dark-signed-in.png) |

## Repeating the browser checks

Use an isolated local backend database and synthetic accounts. Follow the current
frontend and backend setup instructions, configure the frontend API URL and CORS
origin to match, and enable the real HIBP adapter. Do not reuse production data.

1. Prepare an account with a known prior password in history, a different current
   password, active organization membership and `must_change_password: true`.
2. Choose English and the target theme. Open the frontend at the target viewport.
3. Sign in to the same account in two separate browser contexts and record the
   two active session IDs in the local database.
4. In the first context, try mismatched confirmation, then the prior password,
   then a new unique password. Compare the UI and HTTP responses with the results
   above, capturing the required, rejected and successful states.
5. Check that both recorded sessions are closed in the database and that the
   second context cannot access `/auth/me` or protected pages.
6. Verify the previous password is rejected and the new password signs in. Capture
   the organization page, then change the theme, restore it and reload to verify
   persistence.
7. Repeat with a fresh synthetic account for each viewport/theme combination and
   inspect the screenshots for clipping, wrapping and readable status messages.

The browser run used a temporary Playwright harness and isolated services. The
repository's `npm run check` does not start this environment or perform these live
checks; its simulated-transport regression coverage is described in
[the test guide](../../testing.md).

## Commit convention

The two earlier feature commits were reworded into English. Their file trees are
unchanged, as are the trees of the three descendant feature commits recreated to
preserve the branch topology. The inherited `develop` history was not rewritten.

| Original commit | Replacement | English subject |
| --- | --- | --- |
| `933a35b` | `c4110a9` | `feat(passwords): apply global password policy (D1-01)` |
| `c98a656` | `2175e13` | `test(passwords): align tests with the global policy` |

All commits introduced by this PR now use Conventional Commits in English. This
history update changes commit IDs and does not change the application code.
