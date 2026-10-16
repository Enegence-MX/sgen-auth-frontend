export type MfaChoice = 'ENABLE' | 'WAIVE'

export interface InvitationDetails {
  legalName: string
  email: string
  expiresAt: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  hasAccount: boolean
  hasMfa: boolean
  mfaRequired: boolean
  passwordMinLength: number
  passwordExpiryDays?: number
  mfaAllowedMethods?: string[]
  authMode?: 'LOCAL' | 'HYBRID' | 'FEDERATED'
  mfaWaiver: { version: string; text: string } | null
}

export interface InvitationAcceptance {
  email: string
  legalName: string
  mfa: 'ENABLED' | 'WAIVED'
}

export interface CreatedInvitation {
  id: string
  email: string
  roles: string[]
  expiresAt: string
  status: 'PENDING'
}
