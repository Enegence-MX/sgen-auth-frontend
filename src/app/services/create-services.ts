import type { AppConfig } from '../../config/env'
import { createAuthApi } from '../../features/auth/api/auth-api'
import { SessionStore } from '../../features/auth/model/session-store'
import { createOrganizationsApi } from '../../features/organizations/api/organizations-api'
import { createInvitationsApi } from '../../features/invitations/api/invitations-api'
import { createHttpClient } from '../../shared/api/http-client'
import type { SessionLock } from '../../shared/api/session-lock'

export function createServices(config: AppConfig, fetcher: typeof fetch = fetch, lock?: SessionLock) {
  const http = createHttpClient(config.apiBaseUrl, fetcher, lock)
  const auth = new SessionStore(createAuthApi(http))
  http.onSessionExpired(auth.expire)
  return {
    auth,
    organizations: createOrganizationsApi(http),
    invitations: createInvitationsApi(http),
  }
}
export type Services = ReturnType<typeof createServices>
