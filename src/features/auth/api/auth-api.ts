import { ApiError } from '../../../shared/api/errors'
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

export type LoginResult =
  | { status: 'authenticated' }
  | { status: 'mfa'; challenge: MfaChallenge }
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
      const response = await http.exchange<Envelope<LoginResponse>>('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { ...credentials, ...(tenantId ? { tenantId } : {}) },
      })
      if (response.status === 202) {
        const challenge = response.body.data
        if (
          !('mfaRequired' in challenge) ||
          challenge.mfaRequired !== true ||
          challenge.method !== 'EMAIL' ||
          typeof challenge.challengeToken !== 'string' ||
          typeof challenge.sentTo !== 'string' ||
          typeof challenge.expiresAt !== 'string' ||
          !Number.isFinite(Date.parse(challenge.expiresAt))
        )
          throw new ApiError(502, 'INVALID_RESPONSE')
        return { status: 'mfa', challenge } satisfies LoginResult
      }
      if (response.status !== 200) throw new ApiError(502, 'INVALID_RESPONSE')
      return { status: 'authenticated' } satisfies LoginResult
    },
    async verifyMfa(challengeToken: string, code: string) {
      const response = await http.exchange<Envelope<LoginSuccess>>('/auth/mfa/verify', {
        method: 'POST',
        authenticated: false,
        body: { challengeToken, code },
      })
      if (response.status !== 200) throw new ApiError(502, 'INVALID_RESPONSE')
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
