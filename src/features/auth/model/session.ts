import { ApiError } from '../../../shared/api/errors'
import { isRecord } from '../../../shared/api/response'

export interface Identity {
  id: string
  email: string
  name: string
  type: string
  active: boolean
  language?: string
  theme?: string
}
export interface SessionContext {
  accessMode: 'TENANT_USER' | 'PLATFORM_SUPERADMIN'
  organization: { id: string; legalName: string } | null
}
export interface Session {
  identity: Identity
  context: SessionContext
  permissions: { module: string; code: string }[]
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
