import { vi } from 'vitest'
import { createServices } from '../src/app/services/create-services'
import type { Session } from '../src/features/auth/model/session'
import type { InvitationDetails } from '../src/features/invitations/model/invitation'
import type { Organization, SecurityPolicy } from '../src/features/organizations/model/organization'
import type { SessionLock } from '../src/shared/api/session-lock'

export const alpha = '00000000-0000-4000-8000-000000000011'
export const beta = '00000000-0000-4000-8000-000000000012'
export const platform: Session = {
  identity: {
    id: 'identity',
    email: 'platform@example.test',
    name: 'Platform Admin',
    type: 'SUPERADMIN_PLATAFORMA',
    active: true,
  },
  context: { accessMode: 'PLATFORM_SUPERADMIN', organization: null },
  permissions: [],
}
export function tenantSession(id = alpha): Session {
  return {
    ...platform,
    identity: { ...platform.identity, name: 'Tenant Admin', type: 'CLIENTE' },
    context: {
      ...platform.context,
      accessMode: 'TENANT_USER',
      organization: {
        id,
        legalName: id === alpha ? 'Development Alpha' : 'Development Beta',
      },
    },
    permissions: [
      { module: 'SEGURIDAD', code: 'MANAGE_USERS' },
      { module: 'ORGANIZATIONS', code: 'MANAGE_SECURITY_POLICIES' },
    ],
  }
}
export const organization = (id: string, name: string, rfc = 'AAA010101AA1'): Organization => ({
  id,
  razonSocial: name,
  rfcMaestro: rfc,
  sectorIndustrial: null,
  domicilioFiscal: null,
  active: true,
  createdAt: '2026-10-07T12:00:00.000Z',
  updatedAt: '2026-10-07T12:00:00.000Z',
})
const defaultPolicy = (organizationId: string): SecurityPolicy => ({
  organizationId,
  mfaRequired: true,
  mfaAllowedMethods: ['EMAIL_OTP'],
  passwordMinLength: 15,
  passwordExpiryDays: null,
  sessionMaxHours: 12,
  idleTimeoutMinutes: 15,
  maxConcurrentSessions: 3,
  lockoutEnabled: true,
  maxLoginAttempts: 5,
  attemptWindowSeconds: 900,
  lockoutDurationMinutes: 15,
  invitationExpiryHours: 72,
  updatedAt: '2026-10-07T12:00:00.000Z',
})
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
export const denied = (code = 'SESSION_INVALID', status = 401, details?: unknown) =>
  json({ error: { code, details }, requestId: 'test-request' }, status)
export function serialLock(): SessionLock {
  let tail = Promise.resolve()
  return (work) => {
    const operation = tail.then(work)
    tail = operation.then(
      () => {},
      () => {},
    )
    return operation
  }
}
export function fixture(
  options: {
    initial?: Session
    loginAs?: Session
    loginError?: string
    shared?: boolean
    mfaLogin?: boolean
    invitation?: Partial<InvitationDetails>
  } = {},
) {
  let session = options.initial
  const rows = [
    organization(alpha, 'Development Alpha'),
    organization(beta, 'Development Beta', 'BBB010101BB1'),
  ]
  const policies = new Map(rows.map((row) => [row.id, defaultPolicy(row.id)]))
  const invitationDetails: InvitationDetails = {
    legalName: 'Development Alpha',
    email: 'mariana.torres@energia-bajio.test',
    expiresAt: '2026-10-30T12:00:00.000Z',
    status: 'PENDING',
    hasAccount: false,
    hasMfa: false,
    mfaRequired: false,
    passwordMinLength: 15,
    passwordExpiryDays: null,
    mfaAllowedMethods: ['EMAIL'],
    authMode: 'LOCAL',
    mfaWaiver: { version: '1.0', text: 'Acepto omitir MFA para esta cuenta.' },
    ...options.invitation,
  }
  function login(body: Record<string, string>): Response {
    if (options.loginError)
      return denied(options.loginError, options.loginError === 'INVALID_CREDENTIALS' ? 401 : 403)
    if (options.shared && !body.tenantId)
      return denied(
        'TENANT_SELECTION_REQUIRED',
        409,
        rows.map((row) => ({ tenantId: row.id, legalName: row.razonSocial })),
      )
    session = options.shared ? tenantSession(body.tenantId) : (options.loginAs ?? platform)
    if (options.mfaLogin) {
      return json(
        {
          data: {
            mfaRequired: true,
            method: 'EMAIL',
            challengeToken: 'test_mfa_challenge_token_123456',
            sentTo: 'p*****@example.test',
            expiresAt: '2026-10-30T12:00:00.000Z',
          },
        },
        202,
      )
    }
    return json({
      data: { ...session, csrfToken: 'session-csrf', expiresIn: 600 },
    })
  }
  function publicInvitationResponse(
    path: string,
    body: Record<string, unknown>,
  ): Response | undefined {
    if (path.endsWith('/invitations/lookup')) return json({ data: invitationDetails })
    if (path.endsWith('/invitations/mfa/start')) return denied('NOT_FOUND', 404)
    if (!path.endsWith('/invitations/accept')) return undefined
    if ('mfaCode' in body || 'mfaChallengeToken' in body) return denied('VALIDATION_FAILED', 400)
    return json({
      data: {
        email: invitationDetails.email,
        legalName: invitationDetails.legalName,
        mfa: body.mfa === 'WAIVE' ? 'WAIVED' : 'ENABLED',
      },
    })
  }
  function createInvitationResponse(
    path: string,
    body: Record<string, unknown>,
    currentSession: Session,
  ): Response | undefined {
    if (!/^\/api\/v1\/organizations\/[^/]+\/invitations$/.test(path)) return undefined
    const organizationId = path.split('/').at(-2)
    const hasPermission =
      currentSession.context.accessMode === 'PLATFORM_SUPERADMIN' ||
      (currentSession.context.organization?.id === organizationId &&
        currentSession.permissions.some((permission) => permission.code === 'MANAGE_USERS'))
    if (!hasPermission) return denied('PERMISSION_REQUIRED', 403)
    return json(
      {
        data: {
          id: 'invitation-id',
          email: body.email,
          roles: body.roles,
          expiresAt: invitationDetails.expiresAt,
          status: 'PENDING',
        },
      },
      201,
    )
  }
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input))
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    if (url.pathname.endsWith('/auth/csrf')) return json({ data: { csrfToken: 'test-csrf' } })
    if (url.pathname.endsWith('/auth/login')) return login(body as Record<string, string>)
    if (url.pathname.endsWith('/auth/mfa/verify'))
      return body.code === '123456'
        ? json({ data: { success: true } })
        : denied('INVALID_MFA_CODE', 401)
    const publicInvitation = publicInvitationResponse(url.pathname, body)
    if (publicInvitation) return publicInvitation
    if (url.pathname.endsWith('/auth/refresh'))
      return session ? json({ data: { csrfToken: 'rotated-csrf' } }) : denied()
    if (!session) return denied()
    if (url.pathname.endsWith('/auth/me/settings')) {
      session = { ...session, identity: { ...session.identity, ...body } }
      return json({ data: { success: true } })
    }
    if (url.pathname.endsWith('/auth/me')) return json({ data: session })
    if (url.pathname.endsWith('/auth/logout')) {
      session = undefined
      return json({ data: { success: true } })
    }
    const createdInvitation = createInvitationResponse(url.pathname, body, session)
    if (createdInvitation) return createdInvitation
    return organizationResponse(rows, policies, session, url, init?.method, body)
  })
  const services = createServices(
    { apiBaseUrl: 'http://localhost:3000/api/v1' },
    fetcher,
    serialLock(),
  )
  return { services, fetcher, rows, policies }
}

function organizationResponse(
  rows: Organization[],
  policies: Map<string, SecurityPolicy>,
  session: Session,
  url: URL,
  method: string | undefined,
  body: Record<string, unknown>,
): Response {
  const policyMatch = /^\/api\/v1\/organizations\/([^/]+)\/security-policy$/.exec(url.pathname)
  if (policyMatch) return securityPolicyResponse(policies, session, policyMatch[1], method, body)
  if (!url.pathname.endsWith('/organizations')) {
    const id = url.pathname.split('/').at(-1)
    const item = rows.find((row) => row.id === id)
    const tenantId = session.context.organization?.id
    const allowed =
      session.context.accessMode === 'PLATFORM_SUPERADMIN' ||
      (typeof tenantId === 'string' && tenantId === id)
    return item && allowed
      ? json({ data: backendOrganization(item) })
      : denied('ORGANIZATION_NOT_FOUND', 404)
  }
  if (session.context.accessMode !== 'PLATFORM_SUPERADMIN') return denied('PLATFORM_REQUIRED', 403)
  if (method === 'POST') return createOrganization(rows, body)
  const search = url.searchParams.get('search')?.toLowerCase() ?? ''
  const filtered = rows.filter(
    (row) =>
      row.razonSocial.toLowerCase().includes(search) ||
      row.rfcMaestro.toLowerCase().includes(search),
  )
  const page = Number(url.searchParams.get('page') ?? 1)
  const pageSize = Number(url.searchParams.get('pageSize') ?? 25)
  const start = (page - 1) * pageSize
  return json({
    data: filtered.slice(start, start + pageSize).map(backendOrganization),
    meta: { page, pageSize, total: filtered.length },
  })
}
function securityPolicyResponse(
  policies: Map<string, SecurityPolicy>,
  session: Session,
  id: string | undefined,
  method: string | undefined,
  body: Record<string, unknown>,
): Response {
  if (!id) return denied('ORGANIZATION_NOT_FOUND', 404)
  const policy = policies.get(id)
  const ownsTenant =
    session.context.accessMode === 'TENANT_USER' && session.context.organization?.id === id
  const isPlatform = session.context.accessMode === 'PLATFORM_SUPERADMIN'
  if (!policy || (!ownsTenant && !isPlatform)) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (method !== 'PATCH') return json({ data: policy })
  if (!ownsTenant) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (!session.permissions.some((permission) => permission.code === 'MANAGE_SECURITY_POLICIES'))
    return denied('PERMISSION_REQUIRED', 403)
  const updated = {
    ...policy,
    ...body,
    updatedAt: new Date().toISOString(),
  } as SecurityPolicy
  policies.set(id, updated)
  return json({ data: updated })
}
function createOrganization(rows: Organization[], body: Record<string, unknown>): Response {
  const rfc = typeof body.rfc === 'string' ? body.rfc : ''
  if (rows.some((row) => row.rfcMaestro === rfc)) return denied('DUPLICATE_RECORD', 409)
  const item = {
    ...organization(
      '00000000-0000-4000-8000-000000000013',
      typeof body.legalName === 'string' ? body.legalName : '',
      rfc,
    ),
    sectorIndustrial: typeof body.industrySector === 'string' ? body.industrySector : null,
    domicilioFiscal: typeof body.taxAddress === 'string' ? body.taxAddress : null,
  }
  rows.push(item)
  return json({ data: backendOrganization(item) }, 201)
}

function backendOrganization(item: Organization) {
  return {
    id: item.id,
    legalName: item.razonSocial,
    rfc: item.rfcMaestro,
    industrySector: item.sectorIndustrial,
    taxAddress: item.domicilioFiscal,
    active: item.active,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}
