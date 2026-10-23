import { describe, expect, it } from 'vitest'
import { compareContracts } from '../scripts/contract-check'
import { alpha, defaultPasswordState, fixture, organization, platform, tenantSession } from './fixtures'
import { validator } from './support/contract-validator'

describe('contract fixtures', () => {
  it.each([
    ['platform', platform],
    ['tenant', tenantSession()],
  ])('keeps the %s session valid against CurrentSession', (_, session) => {
    expect(validator.errors('CurrentSession', session)).toEqual([])
  })
  it('keeps organizations, policies and password state valid', () => {
    const { policies } = fixture()
    expect(validator.errors('Organization', organization(alpha, 'Development Alpha'))).toEqual([])
    expect(validator.errors('SecurityPolicy', policies.get(alpha))).toEqual([])
    expect(validator.errors('PasswordState', defaultPasswordState)).toEqual([])
  })
  it('rejects field names from the previous contract', () => {
    const { legalName, ...rest } = organization(alpha, 'Development Alpha')
    expect(validator.errors('Organization', { ...rest, razonSocial: legalName })).not.toEqual([])
  })
  it('validates request bodies against the documented DTO', () => {
    expect(validator.requestErrors('POST', '/api/v1/auth/login', { email: 'a@example.test', password: 'x' })).toEqual([])
    expect(validator.requestErrors('POST', '/api/v1/auth/login', { email: 'a@example.test' })).not.toEqual([])
  })
})

describe('contract copy check', () => {
  it('ignores formatting and detects changes', () => {
    expect(compareContracts('{"a":1}', '{\n  "a": 1\n}')).toBe(true)
    expect(compareContracts('{"a":1}', '{"a":2}')).toBe(false)
  })
})
