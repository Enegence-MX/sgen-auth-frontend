import { AuditPanel } from '../../features/audit/components/AuditPanel'
import { useCallback, useState, type SubmitEvent } from 'react'
import { useOutletContext } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Check,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  MailPlus,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { useServices, useSession } from '../services/services-context'
import { isPlatform as isPlatformSession } from '../../features/auth/model/session'
import { useResource } from '../hooks/use-resource'
import { Badge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Spinner } from '../../shared/ui/Loading'
import { Checkbox, Radio } from '../../shared/ui/Checkbox'
import { Card } from '../../shared/ui/Card'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Modal } from '../../shared/ui/Modal'
import { Notice } from '../../shared/ui/Notice'
import { SelectField } from '../../shared/ui/SelectField'
import { Switch } from '../../shared/ui/Switch'
import { Table } from '../../shared/ui/Table'
import { Tabs } from '../../shared/ui/Tabs'
import { TextField } from '../../shared/ui/TextField'
import type { SecurityPolicy, SecurityPolicyChanges } from '../../features/organizations/model/organization'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../features/passwords/model/password-policy'

const policyFieldClassName = 'grid grid-cols-1 items-center gap-x-4 gap-y-2 [&>label]:mb-0 [&_input]:mb-0 [&_select]:mb-0 [&>p]:mb-0 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.65fr)] sm:[&>label]:col-start-1 sm:[&>label]:row-start-1 sm:[&>input]:col-start-2 sm:[&>input]:row-start-1 sm:[&>div]:col-start-2 sm:[&>div]:row-start-1 sm:[&>p]:col-span-2 sm:[&>p]:row-start-2'

type InvitationRole = 'SYSTEM_ADMIN' | 'EXECUTIVE' | 'ENERGY_MANAGER' | 'PLANT_OPERATOR' | 'INTERNAL_AUDITOR'

const invitationRoles: readonly InvitationRole[] = [
  'SYSTEM_ADMIN',
  'EXECUTIVE',
  'ENERGY_MANAGER',
  'PLANT_OPERATOR',
  'INTERNAL_AUDITOR',
]

export function SecurityConsolePage() {
  const { t } = useTranslation()
  const session = useSession()
  const { organizations, invitations } = useServices()
  const { supportOpen, setSupportOpen } = useOutletContext<{
    supportOpen: boolean
    setSupportOpen: (open: boolean) => void
  }>()
  const isPlatform =
    session.status === 'authenticated' && isPlatformSession(session.session)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const loadOrganizationOptions = useCallback(
    (signal: AbortSignal) =>
      isPlatform ? organizations.securityOrganizationOptions(signal) : Promise.resolve([]),
    [isPlatform, organizations],
  )
  const organizationOptions = useResource(loadOrganizationOptions)
  const organizationId = (() => {
    if (session.status !== 'authenticated') return null
    if (isPlatform) return selectedOrganizationId || null
    return session.session.context.organization?.id ?? null
  })()
  const loadPolicy = useCallback(
    (signal: AbortSignal) =>
      organizationId ? organizations.securityPolicy(organizationId, signal) : Promise.resolve(undefined),
    [organizationId, organizations],
  )
  const policyResource = useResource(loadPolicy)
  const [policyDraft, setPolicyDraft] = useState<{
    organizationId: string
    changes: Partial<SecurityPolicyChanges>
  }>()
  const [savedPolicy, setSavedPolicy] = useState<{ organizationId: string; value: SecurityPolicy }>()
  const [saved, setSaved] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoles, setInviteRoles] = useState<InvitationRole[]>([])
  const [inviteError, setInviteError] = useState<unknown>()
  const [creatingInvitation, setCreatingInvitation] = useState(false)
  const [createdInvitation, setCreatedInvitation] = useState<{
    organizationId: string
    email: string
    roles: InvitationRole[]
  }>()
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [policySaveError, setPolicySaveError] = useState<unknown>()
  const [authModePreview, setAuthModePreview] = useState<'LOCAL' | 'HYBRID' | 'FEDERATED'>('HYBRID')
  const [allowMfaOptOutPreview, setAllowMfaOptOutPreview] = useState(false)
  const [federatedMfaModePreview, setFederatedMfaModePreview] = useState('REQUIRE_IDP_EVIDENCE')

  const policy = policyResource.value
  const tenantKey = organizationId ?? ''
  const policyBase = savedPolicy?.organizationId === tenantKey ? savedPolicy.value : policy
  const draft = policyDraft?.organizationId === tenantKey ? policyDraft.changes : {}
  const policyValues = policyBase ? { ...policyBase, ...draft } : undefined
  if (session.status !== 'authenticated') return null

  const canInvite = isPlatform || session.session.permissions.some((permission) => permission.code === 'MANAGE_USERS')
  const markUnsaved = () => {
    setSaved(false)
  }
  function updatePolicy<K extends keyof SecurityPolicyChanges>(
    field: K,
    value: SecurityPolicyChanges[K],
  ) {
    if (!organizationId) return
    setPolicyDraft((current) => ({
      organizationId,
      changes: {
        ...(current?.organizationId === organizationId ? current.changes : {}),
        [field]: value,
      },
    }))
    setPolicySaveError(undefined)
    markUnsaved()
  }
  function updateNumber(
    setter: (value: number) => void,
    rawValue: string,
    minimum: number,
    maximum: number,
  ) {
    const value = Number(rawValue)
    if (Number.isInteger(value) && value >= minimum && value <= maximum) {
      setter(value)
      markUnsaved()
    }
  }

  async function savePolicies(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId || !policyValues || isPlatform) return
    setSavingPolicy(true)
    setPolicySaveError(undefined)
    try {
      const updated = await organizations.updateSecurityPolicy(organizationId, {
        mfaRequired: policyValues.mfaRequired,
        passwordMinLength: policyValues.passwordMinLength,
        passwordExpiryDays: policyValues.passwordExpiryDays,
        sessionMaxHours: policyValues.sessionMaxHours,
        idleTimeoutMinutes: policyValues.idleTimeoutMinutes,
        maxConcurrentSessions: policyValues.maxConcurrentSessions,
        lockoutEnabled: policyValues.lockoutEnabled,
        maxLoginAttempts: policyValues.maxLoginAttempts,
        attemptWindowSeconds: policyValues.attemptWindowSeconds,
        lockoutDurationMinutes: policyValues.lockoutDurationMinutes,
        invitationExpiryHours: policyValues.invitationExpiryHours,
      })
      setSavedPolicy({ organizationId, value: updated })
      setPolicyDraft(undefined)
      setSaved(true)
    } catch (error) {
      setPolicySaveError(error)
    } finally {
      setSavingPolicy(false)
    }
  }

  function toggleInvitationRole(role: InvitationRole) {
    setInviteRoles((current) => current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role])
    setInviteError(undefined)
  }

  async function sendInvitation(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId || !canInvite || !inviteRoles.length) return
    setCreatingInvitation(true)
    setInviteError(undefined)
    setCreatedInvitation(undefined)
    try {
      const created = await invitations.create(organizationId, {
        email: inviteEmail.trim(),
        roles: inviteRoles,
      })
      setCreatedInvitation({ organizationId, email: created.email, roles: inviteRoles })
      setInviteEmail('')
      setInviteRoles([])
    } catch (error) {
      setInviteError(error)
    } finally {
      setCreatingInvitation(false)
    }
  }

  const tabItems = [
    { value: 'policies', label: <><ShieldCheck size={16} aria-hidden="true" />{t('securityConsole.policies')}</>, content: PolicyPanel() },
    { value: 'providers', label: <><Fingerprint size={16} aria-hidden="true" />{t('securityConsole.providers')}</>, content: ProviderPanel() },
    { value: 'users', label: <><Users size={16} aria-hidden="true" />{t('securityConsole.users')}</>, content: UsersPanel() },
    { value: 'groups', label: <><Building2 size={16} aria-hidden="true" />{t('securityConsole.groups')}</>, content: GroupsPanel() },
    { value: 'audit', label: <><LockKeyhole size={16} aria-hidden="true" />{t('securityConsole.audit')}</>, content: <AuditPanel tenantId={isPlatform ? selectedOrganizationId || undefined : undefined} /> },
  ]

  function PolicyPanel() {
    if (!organizationId) {
      return <Notice variant="warning">{t('securityConsole.tenantRequired')}</Notice>
    }
    if (policyResource.loading) return <Spinner label={t('app.loading')} />
    if (policyResource.error !== undefined) {
      return (
        <>
          <ErrorNotice error={policyResource.error} />
          <Button onClick={policyResource.retry}>{t('app.retry')}</Button>
        </>
      )
    }
    if (!policyValues) return <Notice variant="warning">{t('securityConsole.tenantRequired')}</Notice>

    return (
      <form onSubmit={savePolicies} className="grid min-w-0 grid-cols-1 gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.policies')}</h2>
            <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.policyDescription')}</p>
          </div>
          <Button type="submit" loading={savingPolicy} disabled={isPlatform}>
            <Check size={17} aria-hidden="true" />
            {savingPolicy ? t('app.loading') : t('securityConsole.save')}
          </Button>
        </div>
        {isPlatform && <Notice variant="warning">{t('securityConsole.platformPolicyReadOnly')}</Notice>}
        {policySaveError !== undefined && <ErrorNotice error={policySaveError} />}

        <Card>
          <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.authenticationMode')}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(['LOCAL', 'HYBRID', 'FEDERATED'] as const).map((mode) => {
              const selected = authModePreview === mode
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAuthModePreview(mode)}
                  className={`min-h-20 cursor-pointer rounded-control border-2 border-solid p-3 text-left transition-colors ${selected ? 'border-brand bg-brand-soft' : 'border-line bg-panel hover:bg-subtle'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
                >
                  <span className="block text-sm font-bold text-ink">{t(`securityConsole.authMode.${mode}`)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-body">{t(`securityConsole.authModeDescription.${mode}`)}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <KeyRound size={19} className="text-brand" aria-hidden="true" />
              <h3 className="m-0 font-heading text-base font-semibold text-ink">{t('securityConsole.localPasswords')}</h3>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4">
              <div className={policyFieldClassName}>
                <TextField
                  type="number"
                  min={PASSWORD_MIN_LENGTH}
                  max={PASSWORD_MAX_LENGTH}
                  label={t('securityConsole.minimumLength')}
                  disabled={isPlatform}
                  hint={t('password.length', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
                  value={policyValues.passwordMinLength}
                  onChange={(event) => updateNumber((value) => updatePolicy('passwordMinLength', value), event.target.value, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)}
                />
              </div>
              <div className={policyFieldClassName}>
                <SelectField
                  label={t('securityConsole.passwordExpiry')}
                  value={policyValues.passwordExpiryDays ?? ''}
                  disabled={isPlatform}
                  onChange={(event) => updatePolicy('passwordExpiryDays', event.target.value === '' ? null : Number(event.target.value))}
                >
                  <option value="">{t('password.noExpiry')}</option>
                  {[30, 60, 90, 180, 365, 730].map((days) => <option key={days} value={days}>{days} {t('securityConsole.days')}</option>)}
                </SelectField>
              </div>
              <p className="m-0 text-sm leading-relaxed text-body">{t('password.expiryHint')}</p>
              <p className="m-0 rounded-control bg-subtle p-3 text-sm leading-relaxed text-body">
                {t('securityConsole.policyAuditNote')}
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <Fingerprint size={19} className="text-brand" aria-hidden="true" />
              <h3 className="m-0 font-heading text-base font-semibold text-ink">{t('securityConsole.mfa')}</h3>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-line pb-4">
              <div>
                <p className="m-0 font-semibold text-ink">{t('securityConsole.mfaRequired')}</p>
                <p className="mt-1 mb-0 text-sm text-body">{t('securityConsole.mfaRequiredHint')}</p>
              </div>
              <Switch
                label={t('securityConsole.mfaRequired')}
                hideLabel
                checked={policyValues.mfaRequired}
                disabled={isPlatform}
                onChange={(event) => updatePolicy('mfaRequired', event.target.checked)}
              />
            </div>
            <div className="mt-4">
              <p className="m-0 mb-2 text-sm font-semibold text-ink">{t('securityConsole.allowedMethods')}</p>
              <div className="flex flex-wrap gap-2">
                {policyValues.mfaAllowedMethods.map((method) => (
                  <Badge key={method} variant="success">
                    {method === 'EMAIL' || method === 'EMAIL_OTP' ? t('securityConsole.emailMfa') : method}
                  </Badge>
                ))}
                <Badge variant="neutral">{t('securityConsole.authenticatorApp')} · {t('securityConsole.authenticatorAppComingSoon')}</Badge>
              </div>
            </div>
            <div className="mt-5 grid gap-4 border-0 border-t border-solid border-line pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 font-semibold text-ink">{t('securityConsole.allowMfaOptOut')}</p>
                  <p className="mt-1 mb-0 text-xs text-body">{t('securityConsole.allowMfaOptOutHint')}</p>
                </div>
                <Switch label={t('securityConsole.allowMfaOptOut')} hideLabel checked={allowMfaOptOutPreview} onChange={(event) => setAllowMfaOptOutPreview(event.target.checked)} />
              </div>
              <fieldset className="m-0 grid gap-2 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold text-ink">{t('securityConsole.federatedMfa')}</legend>
                {(['TRUST_IDP', 'REQUIRE_IDP_EVIDENCE', 'REQUIRE_SGEN_MFA'] as const).map((mode) => (
                  <Radio key={mode} name="federated-mfa-mode" checked={federatedMfaModePreview === mode} onChange={() => setFederatedMfaModePreview(mode)} label={t(`securityConsole.federatedMfaMode.${mode}.title`)} description={t(`securityConsole.federatedMfaMode.${mode}.description`)} containerClassName="rounded-control border border-solid border-line bg-panel p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft" />
                ))}
              </fieldset>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <Card>
            <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.sessionControls')}</h3>
            <div className="grid min-w-0 grid-cols-1 gap-4">
              <div className={policyFieldClassName}><TextField type="number" min={1} max={720} label={`${t('securityConsole.maximumSession')} (${t('securityConsole.hours')})`} value={policyValues.sessionMaxHours} disabled={isPlatform} onChange={(event) => updateNumber((value) => { updatePolicy('sessionMaxHours', value); if (policyValues.idleTimeoutMinutes > value * 60) updatePolicy('idleTimeoutMinutes', Math.min(480, value * 60)) }, event.target.value, 1, 720)} /></div>
              <div className={policyFieldClassName}><TextField type="number" min={5} max={Math.min(480, policyValues.sessionMaxHours * 60)} label={`${t('securityConsole.idleTimeout')} (${t('securityConsole.minutes')})`} value={policyValues.idleTimeoutMinutes} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('idleTimeoutMinutes', value), event.target.value, 5, Math.min(480, policyValues.sessionMaxHours * 60))} /></div>
              <div className={policyFieldClassName}><TextField type="number" min={1} max={20} label={t('securityConsole.concurrentSessions')} value={policyValues.maxConcurrentSessions} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('maxConcurrentSessions', value), event.target.value, 1, 20)} /></div>
              <div className={policyFieldClassName}><TextField type="number" min={1} max={720} label={`${t('securityConsole.invitationExpiry')} (${t('securityConsole.hours')})`} value={policyValues.invitationExpiryHours} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('invitationExpiryHours', value), event.target.value, 1, 720)} /></div>
            </div>
          </Card>
          <Card>
            <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.accountLockout')}</h3>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="m-0 font-semibold text-ink">{t('securityConsole.lockoutEnabled')}</p>
              <Switch label={t('securityConsole.lockoutEnabled')} hideLabel checked={policyValues.lockoutEnabled} disabled={isPlatform} onChange={(event) => updatePolicy('lockoutEnabled', event.target.checked)} />
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4">
              <div className={policyFieldClassName}><TextField type="number" min={3} max={20} label={t('securityConsole.maxAttempts')} value={policyValues.maxLoginAttempts} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('maxLoginAttempts', value), event.target.value, 3, 20)} /></div>
              <div className={policyFieldClassName}><TextField type="number" min={1} max={1440} label={`${t('securityConsole.attemptWindow')} (${t('securityConsole.minutes')})`} value={policyValues.attemptWindowSeconds / 60} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('attemptWindowSeconds', value * 60), event.target.value, 1, 1440)} /></div>
              <div className={policyFieldClassName}><TextField type="number" min={1} max={1440} label={`${t('securityConsole.lockoutDuration')} (${t('securityConsole.minutes')})`} value={policyValues.lockoutDurationMinutes} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('lockoutDurationMinutes', value), event.target.value, 1, 1440)} /></div>
            </div>
          </Card>
        </div>
        {saved && <Notice variant="success" role="status">{t('securityConsole.saved')}</Notice>}
      </form>
    )
  }

  function ProviderPanel() {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.providers')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.providerDescription')}</p>
        </div>
        <Table caption={t('securityConsole.providers')}>
          <thead>
            <tr>
              <th scope="col">{t('securityConsole.providerName')}</th>
              <th scope="col">{t('securityConsole.protocol')}</th>
              <th scope="col">{t('securityConsole.issuer')}</th>
              <th scope="col">{t('securityConsole.ssoUrl')}</th>
              <th scope="col">{t('securityConsole.status')}</th>
            </tr>
          </thead>
          <tbody />
        </Table>
        <Card>
          <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.domains')}</h3>
          <Table caption={t('securityConsole.domains')} className="min-w-[600px]">
            <thead><tr><th scope="col">{t('securityConsole.domain')}</th><th scope="col">{t('securityConsole.dnsRecord')}</th><th scope="col">{t('securityConsole.status')}</th></tr></thead>
            <tbody />
          </Table>
        </Card>
      </div>
    )
  }

  function UsersPanel() {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.usersAndRoles')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.userDescription')}</p>
        </div>
        <Table caption={t('securityConsole.usersAndRoles')}>
          <thead>
            <tr>
              <th scope="col">{t('securityConsole.account')}</th>
              <th scope="col">{t('securityConsole.signInMethod')}</th>
              <th scope="col">{t('securityConsole.assignedRoles')}</th>
            </tr>
          </thead>
          <tbody />
        </Table>
        {InvitationPanel()}
      </div>
    )
  }

  function InvitationPanel() {
    const roleLabels: Record<InvitationRole, string> = {
      SYSTEM_ADMIN: t('securityConsole.roleSystemAdmin'),
      EXECUTIVE: t('securityConsole.roleExecutive'),
      ENERGY_MANAGER: t('securityConsole.roleEnergyManager'),
      PLANT_OPERATOR: t('securityConsole.rolePlantOperator'),
      INTERNAL_AUDITOR: t('securityConsole.roleInternalAuditor'),
    }
    if (!organizationId) return <Notice variant="warning">{t('securityConsole.tenantRequired')}</Notice>
    if (!canInvite) return <Notice variant="warning">{t('securityConsole.invitationPermissionRequired')}</Notice>
    return (
      <Card>
        <div className="mb-5 flex items-start gap-3">
          <MailPlus size={20} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <h3 className="m-0 font-heading text-base font-semibold text-ink">{t('securityConsole.inviteMember')}</h3>
            <p className="mt-1 mb-0 text-sm leading-relaxed text-body">{t('securityConsole.inviteDescription')}</p>
          </div>
        </div>
        <form className="grid min-w-0 grid-cols-1 gap-5" onSubmit={sendInvitation}>
          <div><TextField
            label={t('securityConsole.inviteEmail')}
            type="email"
            autoComplete="email"
            maxLength={255}
            value={inviteEmail}
            onChange={(event) => { setInviteEmail(event.target.value); setInviteError(undefined) }}
            required
          /></div>
          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-ink">{t('securityConsole.inviteRoles')}</legend>
            {invitationRoles.map((role) => (
              <Checkbox key={role} checked={inviteRoles.includes(role)} onChange={() => toggleInvitationRole(role)} label={roleLabels[role]} description={role} containerClassName="rounded-control p-2 hover:bg-subtle" />
            ))}
          </fieldset>
          {inviteError !== undefined && <ErrorNotice error={inviteError} />}
          {createdInvitation?.organizationId === organizationId && (
            <Notice variant="success" role="status">
              {t('securityConsole.inviteSent', {
                email: createdInvitation.email,
                roles: createdInvitation.roles.join(', '),
              })}
            </Notice>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={creatingInvitation} disabled={!inviteRoles.length}>
              <UserRoundPlus size={17} aria-hidden="true" />
              {creatingInvitation ? t('securityConsole.inviting') : t('securityConsole.sendInvitation')}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  function GroupsPanel() {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.groups')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.groupDescription')}</p>
        </div>
        <Table caption={t('securityConsole.groups')}>
          <thead><tr><th scope="col">{t('securityConsole.objectId')}</th><th scope="col">{t('securityConsole.displayName')}</th><th scope="col">{t('securityConsole.role')}</th></tr></thead>
          <tbody />
        </Table>
      </div>
    )
  }


  return (
    <section className="grid min-w-0 grid-cols-1 gap-6">
      <PageHeader title={t('securityConsole.title')} description={t('securityConsole.description')} eyebrow={t('securityConsole.organization')} actions={<>
        <Button variant="secondary" size="sm" onClick={() => setSupportOpen(true)}>{t('securityConsole.supportContext')}</Button>
        {isPlatform && (
        <div className="w-72 max-w-full [&_select]:mb-0">
          <SelectField label={t('securityConsole.organization')} value={selectedOrganizationId} disabled={organizationOptions.loading} onChange={(event) => {
            setSelectedOrganizationId(event.target.value)
            setPolicyDraft(undefined)
            setSavedPolicy(undefined)
            setSaved(false)
            setPolicySaveError(undefined)
          }}>
            <option value="">{t('securityConsole.selectOrganization')}</option>
            {(organizationOptions.value ?? []).map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </SelectField>
        </div>
      )}</>} />
      {isPlatform && organizationOptions.loading && <Spinner label={t('app.loading')} />}
      {isPlatform && organizationOptions.error !== undefined && (
        <>
          <ErrorNotice error={organizationOptions.error} />
          <Button onClick={organizationOptions.retry}>{t('app.retry')}</Button>
        </>
      )}
      {isPlatform &&
        !organizationOptions.loading &&
        organizationOptions.value?.length === 0 &&
        organizationOptions.error === undefined && (
          <Notice variant="warning">{t('securityConsole.noOrganizations')}</Notice>
        )}
      <Tabs label={t('securityConsole.title')} items={tabItems} />
      <Modal
        open={supportOpen}
        onOpenChange={setSupportOpen}
        title={t('securityConsole.supportTitle')}
        description={t('securityConsole.supportDescription')}
        closeLabel={t('securityConsole.cancel')}
      >
        <Table caption={t('securityConsole.supportTitle')}>
          <thead>
            <tr>
              <th scope="col">{t('securityConsole.organization')}</th>
              <th scope="col">{t('securityConsole.ticket')}</th>
              <th scope="col">{t('securityConsole.status')}</th>
            </tr>
          </thead>
          <tbody />
        </Table>
      </Modal>
    </section>
  )
}
