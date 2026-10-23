import { ApiError, hasCode, isUnauthorized, responseError } from './errors'
import { isRecord } from './response'
import { browserSessionLock, type SessionLock } from './session-lock'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  authenticated?: boolean
  signal?: AbortSignal
}
export interface HttpResponse<T> {
  status: number
  body: T
}
export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>
  /** Same as request, but keeps the HTTP status for contracts that distinguish 200 from 202. */
  exchange<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>>
  refresh(force?: boolean): Promise<void>
  onSessionExpired(handler: () => void): void
  onPasswordChangeRequired(handler: () => void): void
  onPermissionsChanged(handler: () => void): void
}

export function createHttpClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
  lock: SessionLock = browserSessionLock(baseUrl),
): HttpClient {
  let refreshing: Promise<void> | undefined
  let expired = () => {}
  let passwordChangeRequired = () => {}
  let permissionsChanged = () => {}

  async function send<T>(path: string, options: RequestOptions = {}, csrf?: string): Promise<HttpResponse<T>> {
    const response = await fetcher(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal: options.signal,
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    const body: unknown = await response.json()
    if (!response.ok) {
      const error = responseError(response.status, body)
      if (error.code === 'PASSWORD_CHANGE_REQUIRED') passwordChangeRequired()
      if (error.code === 'PERMISSION_REQUIRED') permissionsChanged()
      throw error
    }
    if (!isRecord(body) || !('data' in body)) throw new ApiError(502, 'INVALID_RESPONSE')
    return { status: response.status, body: body as T }
  }

  async function csrfToken(): Promise<string> {
    // Obtain the current cookie-bound value inside the cross-tab lock, never persist it.
    const { body: csrf } = await send<{ data: { csrfToken: string } }>('/auth/csrf')
    if (typeof csrf.data.csrfToken !== 'string') throw new ApiError(502, 'INVALID_RESPONSE')
    return csrf.data.csrfToken
  }

  async function mutation<T>(path: string, options: RequestOptions): Promise<HttpResponse<T>> {
    try {
      return await send<T>(path, options, await csrfToken())
    } catch (error) {
      if (!hasCode(error, 'CSRF_INVALID')) throw error
    }
    return send<T>(path, options, await csrfToken())
  }

  const invoke = <T>(path: string, options: RequestOptions) =>
    options.method && options.method !== 'GET' ? lock(() => mutation<T>(path, options)) : send<T>(path, options)

  async function renew(force: boolean): Promise<void> {
    await lock(async () => {
      // Another tab may already have rotated the refresh token while this one waited.
      if (!force) {
        try {
          await send('/auth/me')
          return
        } catch (error) {
          if (!isUnauthorized(error)) throw error
        }
      }
      await mutation('/auth/refresh', { method: 'POST' })
    })
  }

  function refresh(force = false): Promise<void> {
    refreshing ??= renew(force)
      .catch((error: unknown) => {
        if (isUnauthorized(error)) expired()
        throw error
      })
      .finally(() => {
        refreshing = undefined
      })
    return refreshing
  }

  async function exchange<T>(path: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    try {
      return await invoke<T>(path, options)
    } catch (error) {
      if (options.authenticated === false || !isUnauthorized(error)) throw error
    }
    await refresh()
    try {
      return await invoke<T>(path, options)
    } catch (error) {
      if (isUnauthorized(error)) expired()
      throw error
    }
  }

  return {
    refresh,
    onSessionExpired(handler) {
      expired = handler
    },
    onPasswordChangeRequired(handler) { passwordChangeRequired = handler },
    exchange,
    onPermissionsChanged(handler) { permissionsChanged = handler },
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      return (await exchange<T>(path, options)).body
    },
  }
}
