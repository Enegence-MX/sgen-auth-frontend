import { describe, expect, it } from 'vitest'
import { checkBackend, readPort } from '../dev/backend-check'

const api = 'http://localhost:3000/api/v1'
const origin = 'http://localhost:5173'

const answer =
  (status: number, allowOrigin?: string): typeof fetch =>
  () =>
    Promise.resolve(
      new Response(null, { status, headers: allowOrigin ? { 'access-control-allow-origin': allowOrigin } : {} }),
    )

describe('local startup', () => {
  it('uses 5173 unless FRONTEND_PORT says otherwise', () => {
    expect(readPort(undefined)).toBe(5173)
    expect(readPort('')).toBe(5173)
    expect(readPort('5180')).toBe(5180)
  })

  it.each(['abc', '0', '65536', '51.5'])('rejects FRONTEND_PORT=%s', (value) => {
    expect(() => readPort(value)).toThrow('FRONTEND_PORT')
  })

  it('accepts a backend that answers and allows this origin', async () => {
    const calls: [string, RequestInit | undefined][] = []
    const fetcher: typeof fetch = (url, init) => {
      calls.push([String(url), init])
      return answer(200, origin)(url, init)
    }
    await expect(checkBackend(api, origin, fetcher)).resolves.toEqual({
      ok: true,
      message: `Backend ready at ${api}`,
    })
    expect(calls[0]?.[0]).toBe(`${api}/health`)
    expect(calls[0]?.[1]?.headers).toEqual({ origin })
  })

  it('explains a backend that is not running', async () => {
    const status = await checkBackend(api, origin, () => Promise.reject(new TypeError('fetch failed')))
    expect(status.ok).toBe(false)
    expect(status.message).toContain('Start it with npm run dev in sgen-auth-backend')
  })

  it('explains a wrong API address', async () => {
    const status = await checkBackend(api, origin, answer(404))
    expect(status).toMatchObject({ ok: false })
    expect(status.message).toContain('answered 404')
  })

  it('explains a frontend origin missing from CORS_ORIGINS', async () => {
    const status = await checkBackend(api, 'http://localhost:5180', answer(200))
    expect(status.ok).toBe(false)
    expect(status.message).toContain('Add it to CORS_ORIGINS and FRONTEND_URL')
  })
})
