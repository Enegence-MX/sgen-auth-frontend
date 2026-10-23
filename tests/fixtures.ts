import { vi } from 'vitest'
import { createServices } from '../src/app/services/create-services'
import type { Session } from '../src/features/auth/model/session'
import type { InvitationDetails } from '../src/features/invitations/model/invitation'
import type { Organization, SecurityPolicy } from '../src/features/organizations/model/organization'
import type { PasswordState } from '../src/features/passwords/model/password-policy'
import type { SessionLock } from '../src/shared/api/session-lock'
import { validator } from './support/contract-validator'

export const contractViolations: string[] = []

export const alpha = '00000000-0000-4000-8000-000000000011'
export const beta = '00000000-0000-4000-8000-000000000012'
export const defaultPasswordState: PasswordState = {
  policy: {
    minimumLength: 15,
    maximumLength: 128,
    historyCount: 5,
    expiryDays: null,
    lengthUnit: 'UNICODE_CODE_POINTS',
  },
  changeRequired: false,
  expiresAt: null,
  daysRemaining: null,
  expiresSoon: false,
}
export const platform: Session = {
  identity: {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'platform@example.test',
    name: 'Platform Admin',
    type: 'ENEGENCE_STAFF',
    active: true,
    language: null,
    theme: null,
  },
  context: { accessMode: 'PLATFORM_SUPERADMIN', organization: null },
  permissions: [],
  password: defaultPasswordState,
}
export function tenantSession(id = alpha): Session {
  return {
    ...platform,
    identity: {
      ...platform.identity,
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Tenant Admin',
      type: 'CUSTOMER',
    },
    context: {
      accessMode: 'TENANT_USER',
      organization: {
        id,
        legalName: id === alpha ? 'Development Alpha' : 'Development Beta',
      },
    },
    permissions: [
      { module: 'SECURITY', code: 'MANAGE_USERS' },
      { module: 'ORGANIZATIONS', code: 'MANAGE_SECURITY_POLICIES' },
      { module: 'CONFIGURATION', code: 'MANAGE_ORGANIZATION_PROFILE' },
    ],
  }
}
export const organization = (id: string, name: string, rfc = 'AAA010101AA1'): Organization => ({
  id,
  legalName: name,
  rfc,
  industrySector: null,
  taxAddress: null,
  active: true,
  createdAt: '2026-10-07T12:00:00.000Z',
  updatedAt: '2026-10-07T12:00:00.000Z',
})
const defaultPolicy = (organizationId: string): SecurityPolicy => ({
  organizationId,
  mfaRequired: true,
  mfaAllowedMethods: ['EMAIL'],
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
  json(
    {
      error: { code, message: 'Mensaje del servidor.', ...(details === undefined ? {} : { details }) },
      requestId: crypto.randomUUID(),
    },
    status,
  )
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

const loginErrorStatus: Record<string, number> = {
  INVALID_CREDENTIALS: 401,
  RATE_LIMITED: 429,
}
const passwordErrorStatus: Record<string, number> = {
  CURRENT_PASSWORD_INVALID: 403,
  PASSWORD_CHANGE_BLOCKED: 403,
  PASSWORD_CHECK_UNAVAILABLE: 503,
}
const passwordErrorDetails: Record<string, unknown> = {
  PASSWORD_TOO_SHORT: { minimumLength: 15 },
  PASSWORD_TOO_LONG: { maximumLength: 128 },
}
const MFA_ATTEMPTS = 5

export function fixture(
  options: {
    initial?: Session
    loginAs?: Session
    loginError?: string
    passwordChangeError?: string
    shared?: boolean
    mfaLogin?: boolean
    invitation?: Partial<InvitationDetails>
  } = {},
) {
  let session = options.initial
  let pending: Session | undefined
  let mfaAttemptsLeft = MFA_ATTEMPTS
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
    passwordHistoryCount: 5,
    mfaAllowedMethods: ['EMAIL'],
    authMode: 'LOCAL',
    mfaWaiver: { version: '1.0', text: 'Acepto omitir MFA para esta cuenta.' },
    ...options.invitation,
  }
  const sessionBody = (current: Session) => ({
    data: {
      identity: current.identity,
      context: current.context,
      expiresIn: 600,
      csrfToken: 'session-csrf',
    },
  })
  function login(body: Record<string, string>): Response {
    if (options.loginError)
      return denied(options.loginError, loginErrorStatus[options.loginError] ?? 403)
    if (options.shared && !body.tenantId)
      return denied(
        'TENANT_SELECTION_REQUIRED',
        409,
        rows.map((row) => ({ tenantId: row.id, legalName: row.legalName })),
      )
    const next = options.shared ? tenantSession(body.tenantId) : (options.loginAs ?? platform)
    if (options.mfaLogin) {
      pending = next
      mfaAttemptsLeft = MFA_ATTEMPTS
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
    session = next
    return json(sessionBody(session))
  }
  function verifyMfa(body: Record<string, unknown>): Response {
    if (!pending || mfaAttemptsLeft === 0) return denied('MFA_CHALLENGE_INVALID', 401)
    if (body.code !== '123456') {
      mfaAttemptsLeft--
      return mfaAttemptsLeft === 0
        ? denied('MFA_CHALLENGE_INVALID', 401)
        : denied('INVALID_MFA_CODE', 401, { attemptsLeft: mfaAttemptsLeft })
    }
    session = pending
    pending = undefined
    return json(sessionBody(session))
  }
  function publicInvitationResponse(
    path: string,
    body: Record<string, unknown>,
  ): Response | undefined {
    if (path.endsWith('/invitations/lookup')) return json({ data: invitationDetails })
    if (!path.endsWith('/invitations/accept')) return undefined
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
          id: '00000000-0000-4000-8000-000000000021',
          email: body.email,
          roles: body.roles,
          expiresAt: invitationDetails.expiresAt,
          status: 'PENDING',
        },
      },
      201,
    )
  }
  function passwordResponse(path: string, method: string | undefined): Response | undefined {
    if (path.endsWith('/password/policy')) return json({ data: session?.password })
    if (!path.endsWith('/password/change') || method !== 'PUT') return undefined
    const code = options.passwordChangeError
    if (code) return denied(code, passwordErrorStatus[code] ?? 422, passwordErrorDetails[code])
    session = undefined
    return json({ data: { success: true } })
  }
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const response = await respond(input, init)
    const method = init?.method ?? 'GET'
    const sent: unknown = init?.body ? JSON.parse(String(init.body)) : undefined
    contractViolations.push(
      ...validator.requestErrors(method, String(input), sent),
      ...validator.responseErrors(method, String(input), response.status, await response.clone().json()),
    )
    return response
  })
  async function respond(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = new URL(String(input))
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    if (url.pathname.endsWith('/auth/csrf')) return json({ data: { csrfToken: 'test-csrf' } })
    if (url.pathname.endsWith('/auth/login')) return login(body as Record<string, string>)
    if (url.pathname.endsWith('/auth/mfa/verify')) return verifyMfa(body)
    const publicInvitation = publicInvitationResponse(url.pathname, body)
    if (publicInvitation) return publicInvitation
    if (url.pathname.endsWith('/auth/refresh')) return session ? json(sessionBody(session)) : denied()
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
    const featureResponse = passwordResponse(url.pathname, init?.method)
      ?? createInvitationResponse(url.pathname, body, session)
    if (featureResponse) return featureResponse
    return organizationResponse(rows, policies, session, url, init?.method, body)
  }
  const services = createServices(
    { apiBaseUrl: 'http://localhost:3000/api/v1' },
    fetcher,
    serialLock(),
  )
  return { services, fetcher, rows, policies }
}

const isPlatform = (session: Session) => session.context.accessMode === 'PLATFORM_SUPERADMIN'
const hasPermission = (session: Session, code: string) =>
  session.permissions.some((permission) => permission.code === code)

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
  const statusMatch = /^\/api\/v1\/organizations\/([^/]+)\/(suspend|reactivate)$/.exec(url.pathname)
  if (statusMatch) return statusResponse(rows, session, statusMatch[1], statusMatch[2] === 'reactivate', body)
  if (!url.pathname.endsWith('/organizations')) {
    const id = url.pathname.split('/').at(-1)
    const item = rows.find((row) => row.id === id)
    const allowed = isPlatform(session) || session.context.organization?.id === id
    if (method === 'PATCH') return updateOrganization(session, item, allowed, body)
    return item && allowed ? json({ data: item }) : denied('ORGANIZATION_NOT_FOUND', 404)
  }
  if (!isPlatform(session)) return denied('PLATFORM_REQUIRED', 403)
  if (method === 'POST') return createOrganization(rows, body)
  const search = url.searchParams.get('search')?.toLowerCase() ?? ''
  const filtered = rows.filter(
    (row) =>
      row.legalName.toLowerCase().includes(search) ||
      row.rfc.toLowerCase().includes(search),
  )
  const page = Number(url.searchParams.get('page') ?? 1)
  const pageSize = Number(url.searchParams.get('pageSize') ?? 25)
  const start = (page - 1) * pageSize
  return json({
    data: filtered.slice(start, start + pageSize),
    meta: { page, pageSize, total: filtered.length },
  })
}
function updateOrganization(
  session: Session,
  item: Organization | undefined,
  allowed: boolean,
  body: Record<string, unknown>,
): Response {
  if (!isPlatform(session) && !hasPermission(session, 'MANAGE_ORGANIZATION_PROFILE'))
    return denied('PERMISSION_REQUIRED', 403)
  if (!item || !allowed) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (!isPlatform(session) && 'legalName' in body) return denied('PLATFORM_REQUIRED', 403)
  if (!isPlatform(session) && !item.active) return denied('ACCESS_DENIED', 403)
  if (Object.keys(body).length === 0) return denied('VALIDATION_FAILED', 400, ['Envía al menos un cambio.'])
  if ('taxAddress' in body && !String(body.taxAddress ?? '').trim())
    return denied('VALIDATION_FAILED', 400, ['taxAddress no puede quedar vacío.'])
  Object.assign(item, {
    ...(typeof body.legalName === 'string' ? { legalName: body.legalName.trim() } : {}),
    ...('industrySector' in body
      ? { industrySector: String(body.industrySector ?? '').trim() || null }
      : {}),
    ...(typeof body.taxAddress === 'string' ? { taxAddress: body.taxAddress.trim() } : {}),
    updatedAt: new Date().toISOString(),
  })
  return json({ data: item })
}
function statusResponse(
  rows: Organization[],
  session: Session,
  id: string | undefined,
  active: boolean,
  body: Record<string, unknown>,
): Response {
  if (!isPlatform(session)) return denied('PLATFORM_REQUIRED', 403)
  if (typeof body.reason !== 'string' || !body.reason.trim())
    return denied('VALIDATION_FAILED', 400, ['reason es obligatorio.'])
  const item = rows.find((row) => row.id === id)
  if (!item) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (item.active === active) return denied('CONFLICT', 409)
  item.active = active
  item.updatedAt = new Date().toISOString()
  return json({ data: item })
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
  if (!policy || (!ownsTenant && !isPlatform(session))) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (method !== 'PATCH') return json({ data: policy })
  if (!ownsTenant) return denied('ORGANIZATION_NOT_FOUND', 404)
  if (!hasPermission(session, 'MANAGE_SECURITY_POLICIES')) return denied('PERMISSION_REQUIRED', 403)
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
  if (rows.some((row) => row.rfc === rfc)) return denied('DUPLICATE_RECORD', 409)
  const item = {
    ...organization(
      '00000000-0000-4000-8000-000000000013',
      typeof body.legalName === 'string' ? body.legalName : '',
      rfc,
    ),
    industrySector: typeof body.industrySector === 'string' ? body.industrySector : null,
    taxAddress: typeof body.taxAddress === 'string' ? body.taxAddress : null,
  }
  rows.push(item)
  return json({ data: item }, 201)
}
