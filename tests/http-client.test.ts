import { describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../src/shared/api/http-client'
import { json, denied, serialLock } from './fixtures'
const base = 'http://localhost:3000/api/v1'

describe('cookie session transport', () => {
  it('sends credentials and fresh CSRF on login, without bearer tokens', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: { csrfToken: 'signed-csrf' } }))
      .mockResolvedValueOnce(json({ data: { expiresIn: 600 } }))
    const http = createHttpClient(base, fetcher, serialLock())
    await http.request('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: { email: 'test@example.test', password: crypto.randomUUID() },
    })
    expect(fetcher.mock.calls[0]?.[0]).toBe(`${base}/auth/csrf`)
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      credentials: 'include',
      headers: { 'X-CSRF-Token': 'signed-csrf' },
    })
    expect(fetcher.mock.calls[1]?.[1]?.headers).not.toHaveProperty('Authorization')
  })
  it('never refreshes failed login or forbidden organization operations', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/auth/csrf')
        ? json({ data: { csrfToken: 'csrf' } })
        : denied('INVALID_CREDENTIALS'),
    )
    const http = createHttpClient(base, fetcher, serialLock())
    await expect(http.request('/auth/login', { method: 'POST', authenticated: false })).rejects.toMatchObject(
      { code: 'INVALID_CREDENTIALS' },
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
    fetcher.mockResolvedValue(denied('PLATFORM_REQUIRED', 403))
    await expect(http.request('/organizations')).rejects.toMatchObject({ status: 403 })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it.each([false, true])(
    'coalesces renewal for concurrent requests (separate clients: %s)',
    async (separate) => {
      let valid = false
      let renewals = 0
      const fetcher = vi.fn<typeof fetch>(async (input) => {
        if (String(input).endsWith('/auth/csrf')) return json({ data: { csrfToken: 'csrf' } })
        if (String(input).endsWith('/auth/refresh')) {
          renewals++
          valid = true
          return json({ data: {} })
        }
        return valid ? json({ data: { ok: true } }) : denied()
      })
      const lock = serialLock()
      const first = createHttpClient(base, fetcher, lock)
      const second = separate ? createHttpClient(base, fetcher, lock) : first
      const results = await Promise.all([first.request('/organizations'), second.request('/auth/me')])
      expect(results).toEqual([{ data: { ok: true } }, { data: { ok: true } }])
      expect(renewals).toBe(1)
    },
  )
  it('invalidates the session once when renewal fails and stops retrying', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/auth/csrf') ? json({ data: { csrfToken: 'csrf' } }) : denied(),
    )
    const http = createHttpClient(base, fetcher, serialLock())
    const expired = vi.fn()
    http.onSessionExpired(expired)
    await expect(http.request('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(expired).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1)
  })
  it('serializes cookie/header pairs across mutations in different tabs', async () => {
    let token = 0
    const observed: string[] = []
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input).endsWith('/auth/csrf')) return json({ data: { csrfToken: String(++token) } })
      observed.push(new Headers(init?.headers).get('X-CSRF-Token') ?? '')
      expect(observed.at(-1)).toBe(String(token))
      return json({ data: {} })
    })
    const lock = serialLock()
    await Promise.all([
      createHttpClient(base, fetcher, lock).request('/organizations', { method: 'POST' }),
      createHttpClient(base, fetcher, lock).request('/auth/logout', { method: 'POST' }),
    ])
    expect(observed).toEqual(['1', '2'])
  })
  it('asks for a new CSRF token and retries a mutation once after CSRF_INVALID', async () => {
    let token = 0
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith('/auth/csrf')) return json({ data: { csrfToken: String(++token) } })
      return token === 1 ? denied('CSRF_INVALID', 403) : json({ data: { success: true } })
    })
    const http = createHttpClient(base, fetcher, serialLock())
    await expect(http.request('/auth/logout', { method: 'POST' })).resolves.toEqual({ data: { success: true } })
    expect(fetcher.mock.calls.map(([url]) => String(url).replace(base, ''))).toEqual([
      '/auth/csrf', '/auth/logout', '/auth/csrf', '/auth/logout',
    ])
  })
  it('stops after one CSRF retry', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/auth/csrf') ? json({ data: { csrfToken: 'csrf' } }) : denied('CSRF_INVALID', 403),
    )
    const http = createHttpClient(base, fetcher, serialLock())
    await expect(http.request('/auth/logout', { method: 'POST' })).rejects.toMatchObject({ code: 'CSRF_INVALID' })
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/logout'))).toHaveLength(2)
  })
  it('refreshes once and repeats the request once after AUTHENTICATION_REQUIRED', async () => {
    let valid = false
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith('/auth/csrf')) return json({ data: { csrfToken: 'csrf' } })
      if (String(input).endsWith('/auth/refresh')) {
        valid = true
        return json({ data: {} })
      }
      return valid ? json({ data: { ok: true } }) : denied('AUTHENTICATION_REQUIRED')
    })
    const http = createHttpClient(base, fetcher, serialLock())
    await expect(http.request('/organizations')).resolves.toEqual({ data: { ok: true } })
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/organizations'))).toHaveLength(2)
  })
  it('reports PERMISSION_REQUIRED so the session can reload its permissions', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/auth/csrf') ? json({ data: { csrfToken: 'csrf' } }) : denied('PERMISSION_REQUIRED', 403),
    )
    const http = createHttpClient(base, fetcher, serialLock())
    const changed = vi.fn()
    http.onPermissionsChanged(changed)
    await expect(http.request('/organizations', { method: 'POST' })).rejects.toMatchObject({ status: 403 })
    expect(changed).toHaveBeenCalledOnce()
  })
})
