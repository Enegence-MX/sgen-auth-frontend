import { ApiError } from '../../../shared/api/errors'
import { isRecord } from '../../../shared/api/response'
import type { PasswordState } from '../../passwords/model/password-policy'

export const ACCESS_MODES = ['NO_CONTEXT', 'TENANT_USER', 'PLATFORM_SUPERADMIN'] as const
export type AccessMode = (typeof ACCESS_MODES)[number]
export type IdentityType = 'CUSTOMER' | 'ENEGENCE_STAFF' | 'SERVICE' | 'EXTERNAL_AUDITOR'

export interface Identity {
  id: string
  email: string
  name: string
  type: IdentityType
  active: boolean
  language: string | null
  theme: string | null
}
export interface SessionContext {
  accessMode: AccessMode
  organization: { id: string; legalName: string } | null
}
export interface Session {
  password: PasswordState
  identity: Identity
  context: SessionContext
  permissions: { module: string; code: string }[]
}
export const isPlatform = (session: Session) => session.context.accessMode === 'PLATFORM_SUPERADMIN'
export const isTenant = (session: Session) => session.context.accessMode === 'TENANT_USER'

export function normalizeSession(session: Session): Session {
  const mode = session.context.accessMode
  if (mode !== 'NO_CONTEXT' && ACCESS_MODES.includes(mode)) return session
  return { ...session, context: { accessMode: 'NO_CONTEXT', organization: null }, permissions: [] }
}

export interface TenantChoice {
  tenantId: string
  legalName: string
}

export function tenantChoices(error: unknown): TenantChoice[] {
  if (
    !(error instanceof ApiError) ||
    error.code !== 'TENANT_SELECTION_REQUIRED' ||
    !Array.isArray(error.details)
  )
    return []
  return error.details.filter(
    (item: unknown): item is TenantChoice =>
      isRecord(item) && typeof item.tenantId === 'string' && typeof item.legalName === 'string',
  )
}
