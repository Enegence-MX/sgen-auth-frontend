import type { TFunction } from 'i18next'
import { ApiError } from '../api/errors'

const codes = {
  INVALID_CREDENTIALS: 'invalidCredentials',
  SESSION_INVALID: 'sessionExpired',
  CSRF_INVALID: 'csrf',
  PLATFORM_REQUIRED: 'forbidden',
  ACCESS_DENIED: 'forbidden',
  PERMISSION_REQUIRED: 'forbidden',
  MFA_REQUIRED: 'mfa',
  FEDERATED_LOGIN_REQUIRED: 'federated',
  PASSWORD_CHANGE_REQUIRED: 'passwordChange',
  ORGANIZATION_NOT_FOUND: 'notFound',
  DUPLICATE_RECORD: 'duplicate',
  MFA_POLICY_CONFLICT: 'policy',
  POLICY_MISSING: 'policy',
  REQUEST_FAILED: 'validation',
  INVALID_DATA: 'validation',
  RATE_LIMITED: 'rateLimit',
  INVALID_RESPONSE: 'invalidResponse',
  INVITATION_NOT_FOUND: 'invitationNotFound',
  INVITATION_EXPIRED: 'invitationExpired',
  INVITATION_NOT_PENDING: 'invitationUsed',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
  PASSWORD_TOO_LONG: 'passwordTooLong',
  PASSWORD_COMPROMISED: 'passwordCompromised',
  PASSWORD_CHECK_UNAVAILABLE: 'passwordCheckUnavailable',
  PASSWORD_REUSED: 'passwordReused',
  CURRENT_PASSWORD_INVALID: 'currentPasswordInvalid',
  PASSWORD_CHANGE_BLOCKED: 'passwordChangeBlocked',
  PASSWORD_INVALID_UNICODE: 'passwordInvalidUnicode',
  MFA_REQUIRED_BY_ORGANIZATION: 'mfaRequiredByOrganization',
  MFA_CHOICE_REQUIRED: 'mfaChoiceRequired',
  MFA_CHALLENGE_INVALID: 'mfaChallengeInvalid',
  INVALID_MFA_CODE: 'invalidMfaCode',
  INVITATION_ALREADY_PENDING: 'invitationAlreadyPending',
  INVALID_ROLES: 'validation',
} as const
export function translateError(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const key = Object.hasOwn(codes, error.code) ? codes[error.code as keyof typeof codes] : 'unknown'
    return t(`errors.${key}`)
  }
  if (error instanceof SyntaxError) return t('errors.invalidResponse')
  if (error instanceof TypeError) return t('errors.network')
  if (error instanceof Error && error.message === 'WEB_LOCKS_UNAVAILABLE') return t('errors.browser')
  return t('errors.unknown')
}
