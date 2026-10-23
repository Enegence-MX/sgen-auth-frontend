import { describe, expect, it } from 'vitest'
import { alpha, fixture, organization, platform } from './fixtures'

describe('organizations api', () => {
  it('keeps the contract field names and page meta', async () => {
    const { services } = fixture({ initial: platform })
    const page = await services.organizations.list(1, '')
    expect(page.meta).toEqual({ page: 1, pageSize: 10, total: 2 })
    expect(page.data[0]).toMatchObject({ id: alpha, legalName: 'Development Alpha', rfc: 'AAA010101AA1' })
    expect(await services.organizations.detail(alpha)).toMatchObject({ industrySector: null, taxAddress: null })
  })
  it('loads every page of security console options beyond the 100 item limit', async () => {
    const { services, rows } = fixture({ initial: platform })
    for (let index = 0; index < 150; index++)
      rows.push(organization(`00000000-0000-4000-8000-${String(1000 + index).padStart(12, '0')}`, `Org ${index}`))
    const options = await services.organizations.securityOrganizationOptions()
    expect(options).toHaveLength(152)
  })
})
