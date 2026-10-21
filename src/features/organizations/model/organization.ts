export interface Organization {
  id: string
  razonSocial: string
  rfcMaestro: string
  sectorIndustrial: string | null
  domicilioFiscal: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}
export interface OrganizationInput {
  razonSocial: string
  rfcMaestro: string
  sectorIndustrial?: string
  domicilioFiscal?: string
}
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
export interface OrganizationList {
  data: Organization[]
  meta: { page: number; limit: number; total: number }
}
export interface SecurityOrganizationOption {
  id: string
  name: string
}
