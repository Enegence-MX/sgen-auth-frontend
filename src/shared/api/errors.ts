import { isRecord } from './response'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId?: string

  constructor(status: number, code: string, details?: unknown, requestId?: string) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

export function responseError(status: number, body: unknown): ApiError {
  const error = isRecord(body) && isRecord(body.error) ? body.error : {}
  const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR'
  const requestId = isRecord(body) && typeof body.requestId === 'string' ? body.requestId : undefined
  return new ApiError(status, code, error.details, requestId)
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

/** Nest's ValidationPipe reports each invalid property as a message that starts with its name. */
export function invalidFields(error: unknown): string[] {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED' || !Array.isArray(error.details))
    return []
  const fields = error.details
    .filter((detail: unknown): detail is string => typeof detail === 'string')
    .map((detail) => detail.split(' ', 1)[0] ?? '')
    .filter(Boolean)
  return [...new Set(fields)]
}
