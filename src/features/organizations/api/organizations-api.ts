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

function toOrganization(organization: BackendOrganization): Organization {
  return {
    id: organization.id,
    razonSocial: organization.legalName,
    rfcMaestro: organization.rfc,
    sectorIndustrial: organization.industrySector,
    domicilioFiscal: organization.taxAddress,
    active: organization.active,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  }
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
      data: result.data.map(toOrganization),
      meta: { page: result.meta.page, limit: result.meta.pageSize, total: result.meta.total },
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
          name: organization.razonSocial,
        }),
      )
    },
    async detail(id: string, signal?: AbortSignal) {
      const result = await http.request<Envelope<BackendOrganization>>(
        `/organizations/${encodeURIComponent(id)}`,
        { signal },
      )
      return toOrganization(result.data)
    },
    async create(input: OrganizationInput) {
      const result = await http.request<Envelope<BackendOrganization>>('/organizations', {
        method: 'POST',
        body: {
          legalName: input.razonSocial,
          rfc: input.rfcMaestro,
          ...(input.sectorIndustrial ? { industrySector: input.sectorIndustrial } : {}),
          ...(input.domicilioFiscal ? { taxAddress: input.domicilioFiscal } : {}),
        },
      })
      return toOrganization(result.data)
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
