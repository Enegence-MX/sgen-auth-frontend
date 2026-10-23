import type { TFunction } from 'i18next'
import { ApiError } from '../api/errors'

const codes = {
  VALIDATION_FAILED: 'validation',
  MFA_CHOICE_REQUIRED: 'mfaChoiceRequired',
  AUTHENTICATION_REQUIRED: 'sessionExpired',
  INVALID_CREDENTIALS: 'invalidCredentials',
  INVALID_MFA_CODE: 'invalidMfaCode',
  MFA_CHALLENGE_INVALID: 'mfaChallengeInvalid',
  SESSION_INVALID: 'sessionExpired',
  CSRF_INVALID: 'csrf',
  CURRENT_PASSWORD_INVALID: 'currentPasswordInvalid',
  FEDERATED_LOGIN_REQUIRED: 'federated',
  PASSWORD_CHANGE_BLOCKED: 'passwordChangeBlocked',
  PASSWORD_CHANGE_REQUIRED: 'passwordChange',
  PERMISSION_REQUIRED: 'forbidden',
  PLATFORM_REQUIRED: 'forbidden',
  ACCESS_DENIED: 'forbidden',
  NOT_FOUND: 'resourceNotFound',
  ORGANIZATION_NOT_FOUND: 'notFound',
  INVITATION_NOT_FOUND: 'invitationNotFound',
  METHOD_NOT_ALLOWED: 'unknown',
  CONFLICT: 'conflict',
  DUPLICATE_RECORD: 'duplicate',
  ACCOUNT_EXISTS: 'accountExists',
  INVITATION_ALREADY_PENDING: 'invitationAlreadyPending',
  INVITATION_NOT_PENDING: 'invitationUsed',
  MFA_POLICY_CONFLICT: 'policy',
  POLICY_MISSING: 'policy',
  TENANT_SELECTION_REQUIRED: 'tenantSelection',
  INVITATION_EXPIRED: 'invitationExpired',
  PAYLOAD_TOO_LARGE: 'validation',
  INVALID_DATA: 'validation',
  INVALID_ROLES: 'validation',
  MFA_REQUIRED_BY_ORGANIZATION: 'mfaRequiredByOrganization',
  PASSWORD_COMPROMISED: 'passwordCompromised',
  PASSWORD_INVALID_UNICODE: 'passwordInvalidUnicode',
  PASSWORD_REUSED: 'passwordReused',
  PASSWORD_TOO_LONG: 'passwordTooLong',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
  RATE_LIMITED: 'rateLimit',
  INTERNAL_ERROR: 'unknown',
  DATABASE_NOT_READY: 'serviceStarting',
  INVALID_DATABASE_ROLE: 'unknown',
  PASSWORD_CHECK_UNAVAILABLE: 'passwordCheckUnavailable',
  INVALID_RESPONSE: 'invalidResponse',
} as const

type ErrorKey = (typeof codes)[keyof typeof codes] | 'unknown'

export function errorTranslationKey(code: string): ErrorKey {
  return Object.hasOwn(codes, code) ? codes[code as keyof typeof codes] : 'unknown'
}

export function translateError(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (!Object.hasOwn(codes, error.code) && error.serverMessage) return error.serverMessage
    return t(`errors.${errorTranslationKey(error.code)}`)
  }
  if (error instanceof SyntaxError) return t('errors.invalidResponse')
  if (error instanceof TypeError) return t('errors.network')
  if (error instanceof Error && error.message === 'WEB_LOCKS_UNAVAILABLE') return t('errors.browser')
  return t('errors.unknown')
}
