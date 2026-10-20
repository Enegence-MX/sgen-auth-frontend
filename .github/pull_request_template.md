## Ticket
<!-- ID and link. One ticket per PR. -->
T-XX:

## Why
<!-- The problem or the goal, in 1–3 lines. Cite the document section if it applies (e.g. ARQ-01 §7.2). -->

## What changes
<!-- Short list. For each decision that is not obvious, say why. -->
-

## How to test
<!-- Exact steps a reviewer can follow locally, and the expected result. -->
1.

## Evidence
<!-- Test results, command output or screenshots (hide secrets). -->

## Checklist
- [ ] Branch `<type>/<ticket>-<short-description>` from `develop`, PR to `develop`
- [ ] Conventional Commits in English
- [ ] Tests added or updated, and `npm run check` passes locally
- [ ] Documentation updated (README, `docs/<ticket>/`) if behaviour or setup changes
- [ ] No secrets, personal settings or unrelated changes
- [ ] Decisions that change an architecture document are approved and recorded
- [ ] Screenshots or video of the screens, on desktop and mobile
- [ ] Texts in Spanish and English (i18n)
- [ ] Light and dark themes checked
- [ ] Tested against the real backend, not only mocks

## Risks and rollback
<!-- What could break, and how to undo it. "None" is a valid answer. -->
