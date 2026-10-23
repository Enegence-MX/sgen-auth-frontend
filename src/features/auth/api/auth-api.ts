import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope } from '../../../shared/api/response'
import type { Credentials } from '../model/credentials'
import { normalizeSession, type Session } from '../model/session'
import type { MfaChallenge } from '../model/mfa-challenge'

type LoginSuccess = {
  identity: Session['identity']
  context: Session['context']
  expiresIn: number
  csrfToken: string
}

type LoginResponse = LoginSuccess | MfaChallenge

export interface SettingsChanges {
  language?: string
  theme?: string
}

export function createAuthApi(http: HttpClient) {
  return {
    async profile() {
      return normalizeSession((await http.request<Envelope<Session>>('/auth/me')).data)
    },
    async login(credentials: Credentials, tenantId?: string) {
      return (
        await http.request<Envelope<LoginResponse>>('/auth/login', {
          method: 'POST',
          authenticated: false,
          body: { ...credentials, ...(tenantId ? { tenantId } : {}) },
        })
      ).data
    },
    async verifyMfa(challengeToken: string, code: string) {
      await http.request<Envelope<LoginSuccess>>('/auth/mfa/verify', {
        method: 'POST',
        authenticated: false,
        body: { challengeToken, code },
      })
    },
    async logout() {
      await http.request('/auth/logout', { method: 'POST' })
    },
    async updateSettings(settings: SettingsChanges) {
      await http.request('/auth/me/settings', {
        method: 'PATCH',
        body: settings,
      })
    },
    async refresh() {
      await http.refresh(true)
    },
  }
}
export type AuthApi = ReturnType<typeof createAuthApi>
