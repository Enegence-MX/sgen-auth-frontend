import type { Page } from '../../../shared/api/response'

export interface Organization {
  id: string
  legalName: string
  rfc: string
  industrySector: string | null
  taxAddress: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}
export interface OrganizationInput {
  legalName: string
  rfc: string
  industrySector?: string
  taxAddress?: string
  mfaRequired?: boolean
}
export interface OrganizationChanges {
  legalName?: string
  industrySector?: string | null
  taxAddress?: string
}
export const ORGANIZATION_LIMITS = { legalName: 255, industrySector: 150, taxAddress: 4000, reason: 500 } as const
export interface SecurityPolicy {
  organizationId: string
  mfaRequired: boolean
  mfaAllowedMethods: string[]
  passwordMinLength: number
  passwordExpiryDays: number | null
  sessionMaxHours: number
  idleTimeoutMinutes: number
  maxConcurrentSessions: number
  lockoutEnabled: boolean
  maxLoginAttempts: number
  attemptWindowSeconds: number
  lockoutDurationMinutes: number
  invitationExpiryHours: number
  updatedAt: string
}
export type SecurityPolicyChanges = Omit<SecurityPolicy, 'organizationId' | 'mfaAllowedMethods' | 'updatedAt'>
export type OrganizationList = Page<Organization>
export interface SecurityOrganizationOption {
  id: string
  name: string
}
