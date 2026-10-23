import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope, Page } from '../../../shared/api/response'
export interface AuditEvent {
  id: string
  actorId: string | null
  actorName: string | null
  scope: string
  tenantId: string | null
  tenantName: string | null
  groupId: string | null
  groupName: string | null
  action: string
  module: string
  entityType: string
  entityId: string | null
  entityName: string | null
  createdAt: string
  result: string
  reason: string | null
  requestId: string | null
  before: unknown
  after: unknown
}
export type AuditFilters = Partial<Record<'from' | 'to' | 'actor' | 'actorId' | 'action' | 'scope' | 'result' | 'tenantId' | 'groupId', string>>
export function createAuditApi(http: HttpClient) {
  return {
    list(page: number, filters: AuditFilters, signal?: AbortSignal) {
      const query = new URLSearchParams({ page: String(page), pageSize: '25' })
      for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value)
      return http.request<Page<AuditEvent>>(`/audit-events?${query}`, { signal })
    },
    async catalog(signal?: AbortSignal) {
      return (await http.request<Envelope<{ action: string; module: string; reasonRequired: boolean }[]>>('/audit-events/catalog', { signal })).data
    },
  }
}
