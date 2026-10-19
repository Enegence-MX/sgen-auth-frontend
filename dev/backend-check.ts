import type { Plugin } from 'vite'

export const DEFAULT_FRONTEND_PORT = 5173

export function readPort(value: string | undefined): number {
  if (!value?.trim()) return DEFAULT_FRONTEND_PORT
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('FRONTEND_PORT must be an integer between 1 and 65535.')
  return port
}

export interface BackendStatus {
  ok: boolean
  message: string
}

/** The backend must answer its health check and accept this frontend's origin in CORS_ORIGINS. */
export async function checkBackend(
  apiBaseUrl: string,
  origin: string,
  fetcher: typeof fetch = fetch,
): Promise<BackendStatus> {
  const url = `${apiBaseUrl}/health`
  let response: Response
  try {
    response = await fetcher(url, { headers: { origin }, signal: AbortSignal.timeout(3000) })
  } catch {
    return {
      ok: false,
      message: `Backend not reachable at ${url}. Start it with npm run dev in sgen-auth-backend, or check VITE_API_BASE_URL in .env.`,
    }
  }
  if (!response.ok)
    return { ok: false, message: `Backend at ${url} answered ${response.status}. Check VITE_API_BASE_URL in .env.` }
  if (response.headers.get('access-control-allow-origin') !== origin)
    return {
      ok: false,
      message: `Backend at ${apiBaseUrl} does not accept ${origin}. Add it to CORS_ORIGINS and FRONTEND_URL in sgen-auth-backend/.env, or change FRONTEND_PORT here.`,
    }
  return { ok: true, message: `Backend ready at ${apiBaseUrl}` }
}

export function backendCheck(apiBaseUrl: string, origin: string): Plugin {
  return {
    name: 'sgen-backend-check',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        void checkBackend(apiBaseUrl, origin).then(({ ok, message }) =>
          ok ? server.config.logger.info(`  ✓ ${message}`) : server.config.logger.warn(`  ⚠ ${message}`),
        )
      })
    },
  }
}
