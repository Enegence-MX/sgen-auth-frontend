import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope } from '../../../shared/api/response'
import type {
  Organization,
  OrganizationInput,
  OrganizationList,
  SecurityOrganizationOption,
  SecurityPolicy,
  SecurityPolicyChanges,
} from '../model/organization'

const MAX_PAGE_SIZE = 100

export function createOrganizationsApi(http: HttpClient) {
  async function list(page: number, pageSize: number, search: string, signal?: AbortSignal) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search ? { search } : {}),
    })
    return http.request<OrganizationList>(`/organizations?${query}`, { signal })
  }

  return {
    list(page: number, search: string, signal?: AbortSignal): Promise<OrganizationList> {
      return list(page, 10, search, signal)
    },
    async securityOrganizationOptions(signal?: AbortSignal) {
      const items: Organization[] = []
      for (let page = 1; ; page++) {
        const result = await list(page, MAX_PAGE_SIZE, '', signal)
        items.push(...result.data)
        if (!result.data.length || items.length >= result.meta.total) break
      }
      return items.map(
        (organization): SecurityOrganizationOption => ({
          id: organization.id,
          name: organization.legalName,
        }),
      )
    },
    async detail(id: string, signal?: AbortSignal) {
      return (
        await http.request<Envelope<Organization>>(`/organizations/${encodeURIComponent(id)}`, { signal })
      ).data
    },
    async create(input: OrganizationInput) {
      return (await http.request<Envelope<Organization>>('/organizations', { method: 'POST', body: input })).data
    },
    async securityPolicy(id: string, signal?: AbortSignal) {
      return (
        await http.request<Envelope<SecurityPolicy>>(
          `/organizations/${encodeURIComponent(id)}/security-policy`,
          { signal },
        )
      ).data
    },
    async updateSecurityPolicy(id: string, changes: SecurityPolicyChanges) {
      return (
        await http.request<Envelope<SecurityPolicy>>(
          `/organizations/${encodeURIComponent(id)}/security-policy`,
          { method: 'PATCH', body: changes },
        )
      ).data
    },
  }
}
