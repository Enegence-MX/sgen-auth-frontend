import { isRecord } from './response'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId?: string
  readonly serverMessage?: string

  constructor(status: number, code: string, details?: unknown, requestId?: string, serverMessage?: string) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    this.serverMessage = serverMessage
  }
}

export function responseError(status: number, body: unknown): ApiError {
  const error = isRecord(body) && isRecord(body.error) ? body.error : {}
  const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR'
  const requestId = isRecord(body) && typeof body.requestId === 'string' ? body.requestId : undefined
  const message = typeof error.message === 'string' ? error.message : undefined
  return new ApiError(status, code, error.details, requestId, message)
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function hasCode(error: unknown, code: string): error is ApiError {
  return error instanceof ApiError && error.code === code
}

export function validationMessages(error: unknown): string[] {
  if (!hasCode(error, 'VALIDATION_FAILED') || !Array.isArray(error.details)) return []
  return error.details.filter((item: unknown): item is string => typeof item === 'string')
}

export function numericDetail(error: unknown, code: string, field: string): number | undefined {
  if (!hasCode(error, code) || !isRecord(error.details)) return undefined
  const value = error.details[field]
  return typeof value === 'number' ? value : undefined
}
