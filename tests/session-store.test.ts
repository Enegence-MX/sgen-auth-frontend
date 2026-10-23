import { describe, expect, it, vi } from 'vitest'
import { createAuthApi } from '../src/features/auth/api/auth-api'
import { SessionStore } from '../src/features/auth/model/session-store'
import { createHttpClient } from '../src/shared/api/http-client'
import { fixture, platform, serialLock } from './fixtures'

describe('session updates during authentication', () => {
  it.each(['login', 'mfa'] as const)(
    'does not restore a session from a delayed profile after expiration during %s',
    async (flow) => {
      const setup = fixture({ mfaLogin: flow === 'mfa' })
      const api = createAuthApi(createHttpClient('http://localhost:3000/api/v1', setup.fetcher, serialLock()))
      const broadcast = vi.fn()
      const store = new SessionStore(api, broadcast)
      let resolveProfile!: (session: typeof platform) => void
      const profile = new Promise<typeof platform>((resolve) => { resolveProfile = resolve })
      const loadProfile = vi.spyOn(api, 'profile').mockReturnValue(profile)
      const credentials = { email: 'test@example.test', password: crypto.randomUUID() }
      if (flow === 'mfa') await store.login(credentials)
      const authenticating = flow === 'login'
        ? store.login(credentials)
        : store.verifyMfa('test_mfa_challenge_token_123456', '123456')
      await vi.waitFor(() => expect(loadProfile).toHaveBeenCalledOnce())
      store.expire()
      resolveProfile(platform)
      await authenticating
      expect(store.getSnapshot()).toEqual({ status: 'anonymous', session: null })
      expect(broadcast).not.toHaveBeenCalled()
    },
  )
})
