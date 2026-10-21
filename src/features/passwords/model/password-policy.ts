export interface PasswordPolicy {
  minimumLength: number
  maximumLength: number
  historyCount: number
  expiryDays: number | null
  lengthUnit: 'UNICODE_CODE_POINTS'
}
export interface PasswordState {
  policy: PasswordPolicy
  changeRequired: boolean
  expiresAt: string | null
  daysRemaining: number | null
  expiresSoon: boolean
}

export const PASSWORD_MIN_LENGTH = 15
export const PASSWORD_MAX_LENGTH = 128

export const passwordLength = (password: string) => Array.from(password).length
