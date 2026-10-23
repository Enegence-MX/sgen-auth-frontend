import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope } from '../../../shared/api/response'
import type {
  OrganizationInput,
  OrganizationList,
  SecurityOrganizationOption,
  SecurityPolicy,
  SecurityPolicyChanges,
} from '../model/organization'

interface BackendOrganization {
  id: string
  legalName: string
  rfc: string
  industrySector: string | null
  taxAddress: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}
interface BackendOrganizationPage {
  data: BackendOrganization[]
  meta: { page: number; pageSize: number; total: number }
}

export function createOrganizationsApi(http: HttpClient) {
  async function list(page: number, pageSize: number, search: string, signal?: AbortSignal) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search ? { search } : {}),
    })
    const result = await http.request<BackendOrganizationPage>(`/organizations?${query}`, { signal })
    return {
      data: result.data,
      meta: result.meta,
    }
  }

  return {
    list(page: number, search: string, signal?: AbortSignal): Promise<OrganizationList> {
      return list(page, 10, search, signal)
    },
    async securityOrganizationOptions(signal?: AbortSignal) {
      const result = await list(1, 100, '', signal)
      return result.data.map(
        (organization): SecurityOrganizationOption => ({
          id: organization.id,
          name: organization.legalName,
        }),
      )
    },
    async detail(id: string, signal?: AbortSignal) {
      const result = await http.request<Envelope<BackendOrganization>>(
        `/organizations/${encodeURIComponent(id)}`,
        { signal },
      )
      return result.data
    },
    async create(input: OrganizationInput) {
      const result = await http.request<Envelope<BackendOrganization>>('/organizations', {
        method: 'POST',
        body: {
          legalName: input.legalName,
          rfc: input.rfc,
          ...(input.industrySector ? { industrySector: input.industrySector } : {}),
          ...(input.taxAddress ? { taxAddress: input.taxAddress } : {}),
        },
      })
      return result.data
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
