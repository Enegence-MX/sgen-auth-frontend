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
import { useResource } from '../hooks/use-resource'
import { Badge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'
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
    session.status === 'authenticated' &&
    session.session.context.accessMode === 'PLATFORM_SUPERADMIN'
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
  const [passwordHistoryPreview, setPasswordHistoryPreview] = useState<Record<string, number>>({})
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
  const displayedPasswordHistory = policyBase
    ? passwordHistoryPreview[tenantKey] ?? policyValues?.passwordHistoryCount ?? policyBase.passwordHistoryCount
    : 0

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
    { value: 'audit', label: <><LockKeyhole size={16} aria-hidden="true" />{t('securityConsole.audit')}</>, content: AuditPanel() },
  ]

  function PolicyPanel() {
    if (!organizationId) {
      return <Notice variant="warning">{t('securityConsole.tenantRequired')}</Notice>
    }
    if (policyResource.loading) return <p role="status">{t('app.loading')}</p>
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
      <form onSubmit={savePolicies} className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.policies')}</h2>
            <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.policyDescription')}</p>
          </div>
          <Button type="submit" disabled={savingPolicy || isPlatform}>
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
            <div className="grid gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.75fr)] items-center gap-x-4 gap-y-1 [&>label]:col-start-1 [&>label]:row-start-1 [&>input]:col-start-2 [&>input]:row-start-1 [&>p]:col-span-2 [&>p]:row-start-2">
                <TextField
                  type="number"
                  min={8}
                  max={128}
                  label={t('securityConsole.minimumLength')}
                  disabled={isPlatform}
                  hint={policyValues.passwordMinLength < 14 ? t('securityConsole.recommendedLength') : t('securityConsole.meetsRecommendation')}
                  value={policyValues.passwordMinLength}
                  onChange={(event) => updateNumber((value) => updatePolicy('passwordMinLength', value), event.target.value, 8, 128)}
                />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.75fr)] items-center gap-x-4 gap-y-1 [&>label]:col-start-1 [&>div]:col-start-2 [&>div]:row-start-1">
                <SelectField
                  label={t('securityConsole.passwordExpiry')}
                  value={policyValues.passwordExpiryDays}
                  disabled={isPlatform}
                  onChange={(event) => updatePolicy('passwordExpiryDays', Number(event.target.value))}
                >
                  {[30, 60, 90, 180, 365, 730].map((days) => <option key={days} value={days}>{days} {t('securityConsole.days')}</option>)}
                </SelectField>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.75fr)] items-center gap-x-4 gap-y-1 border-0 border-t border-solid border-line pt-4 [&>label]:col-start-1 [&>label]:row-start-1 [&>input]:col-start-2 [&>input]:row-start-1">
                <TextField
                  type="number"
                  min={0}
                  max={24}
                  step={1}
                  label={t('securityConsole.passwordHistory')}
                  disabled={isPlatform}
                  value={displayedPasswordHistory}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isInteger(value) && value >= 0 && value <= 24) {
                      setPasswordHistoryPreview((current) => ({ ...current, [tenantKey]: value }))
                    }
                  }}
                />
              </div>
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
                  <label key={mode} className={`flex cursor-pointer items-start gap-3 rounded-control border border-solid p-3 ${federatedMfaModePreview === mode ? 'border-brand bg-brand-soft' : 'border-line bg-panel'}`}>
                    <input type="radio" name="federated-mfa-mode" checked={federatedMfaModePreview === mode} onChange={() => setFederatedMfaModePreview(mode)} className="mt-1 accent-brand" />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{t(`securityConsole.federatedMfaMode.${mode}.title`)}</span>
                      <span className="text-xs text-body">{t(`securityConsole.federatedMfaMode.${mode}.description`)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <Card>
            <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.sessionControls')}</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={1} max={720} label={`${t('securityConsole.maximumSession')} (${t('securityConsole.hours')})`} value={policyValues.sessionMaxHours} disabled={isPlatform} onChange={(event) => updateNumber((value) => { updatePolicy('sessionMaxHours', value); if (policyValues.idleTimeoutMinutes > value * 60) updatePolicy('idleTimeoutMinutes', Math.min(480, value * 60)) }, event.target.value, 1, 720)} /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={5} max={Math.min(480, policyValues.sessionMaxHours * 60)} label={`${t('securityConsole.idleTimeout')} (${t('securityConsole.minutes')})`} value={policyValues.idleTimeoutMinutes} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('idleTimeoutMinutes', value), event.target.value, 5, Math.min(480, policyValues.sessionMaxHours * 60))} /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={1} max={20} label={t('securityConsole.concurrentSessions')} value={policyValues.maxConcurrentSessions} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('maxConcurrentSessions', value), event.target.value, 1, 20)} /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={1} max={720} label={`${t('securityConsole.invitationExpiry')} (${t('securityConsole.hours')})`} value={policyValues.invitationExpiryHours} disabled={isPlatform} onChange={(event) => updateNumber((value) => updatePolicy('invitationExpiryHours', value), event.target.value, 1, 720)} /></div>
            </div>
          </Card>
          <Card>
            <h3 className="m-0 mb-4 font-heading text-base font-semibold text-ink">{t('securityConsole.accountLockout')}</h3>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="m-0 font-semibold text-ink">{t('securityConsole.lockoutEnabled')}</p>
              <Switch label={t('securityConsole.lockoutEnabled')} hideLabel checked={policyValues.lockoutEnabled} disabled={isPlatform} onChange={(event) => updatePolicy('lockoutEnabled', event.target.checked)} />
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={3} max={20} label={t('securityConsole.maxAttempts')} value={policyValues.maxLoginAttempts} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('maxLoginAttempts', value), event.target.value, 3, 20)} /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={1} max={1440} label={`${t('securityConsole.attemptWindow')} (${t('securityConsole.minutes')})`} value={policyValues.attemptWindowSeconds / 60} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('attemptWindowSeconds', value * 60), event.target.value, 1, 1440)} /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.55fr)] items-center gap-x-4 [&>label]:col-start-1 [&>input]:col-start-2 [&>input]:row-start-1"><TextField type="number" min={1} max={1440} label={`${t('securityConsole.lockoutDuration')} (${t('securityConsole.minutes')})`} value={policyValues.lockoutDurationMinutes} disabled={isPlatform || !policyValues.lockoutEnabled} onChange={(event) => updateNumber((value) => updatePolicy('lockoutDurationMinutes', value), event.target.value, 1, 1440)} /></div>
            </div>
          </Card>
        </div>
        {saved && <Notice variant="success" role="status">{t('securityConsole.saved')}</Notice>}
      </form>
    )
  }

  function ProviderPanel() {
    return (
      <div className="grid gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.providers')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.providerDescription')}</p>
        </div>
        <Card>
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
        </Card>
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
      <div className="grid gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.usersAndRoles')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.userDescription')}</p>
        </div>
        <Card>
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
        </Card>
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
        <form className="grid gap-5" onSubmit={sendInvitation}>
          <TextField
            label={t('securityConsole.inviteEmail')}
            type="email"
            autoComplete="email"
            maxLength={255}
            value={inviteEmail}
            onChange={(event) => { setInviteEmail(event.target.value); setInviteError(undefined) }}
            required
          />
          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-ink">{t('securityConsole.inviteRoles')}</legend>
            {invitationRoles.map((role) => (
              <label key={role} className="flex cursor-pointer items-start gap-3 rounded-control p-2 hover:bg-subtle">
                <input
                  type="checkbox"
                  checked={inviteRoles.includes(role)}
                  onChange={() => toggleInvitationRole(role)}
                  className="mt-1 size-4 accent-brand"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{roleLabels[role]}</span>
                  <span className="text-xs text-body">{role}</span>
                </span>
              </label>
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
      <div className="grid gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.groups')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.groupDescription')}</p>
        </div>
        <Card>
          <Table caption={t('securityConsole.groups')}>
            <thead><tr><th scope="col">{t('securityConsole.objectId')}</th><th scope="col">{t('securityConsole.displayName')}</th><th scope="col">{t('securityConsole.role')}</th></tr></thead>
            <tbody />
          </Table>
        </Card>
      </div>
    )
  }

  function AuditPanel() {
    return (
      <div className="grid gap-5">
        <div>
          <h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('securityConsole.audit')}</h2>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.auditDescription')}</p>
        </div>
        <Table caption={t('securityConsole.audit')}>
          <thead><tr><th scope="col">{t('securityConsole.date')}</th><th scope="col">{t('securityConsole.actor')}</th><th scope="col">{t('securityConsole.event')}</th><th scope="col">{t('securityConsole.detail')}</th></tr></thead>
          <tbody />
        </Table>
      </div>
    )
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-brand uppercase">{t('securityConsole.organization')}</p>
          <h1 className="m-0 font-heading text-2xl font-semibold text-ink sm:text-3xl">{t('securityConsole.title')}</h1>
          <p className="mt-2 mb-0 text-sm text-body">{t('securityConsole.description')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {isPlatform && (
            <div className="min-w-64 flex-1 sm:max-w-sm">
              <SelectField
                label={t('securityConsole.organization')}
                value={selectedOrganizationId}
                disabled={organizationOptions.loading}
                onChange={(event) => {
                  setSelectedOrganizationId(event.target.value)
                  setPolicyDraft(undefined)
                  setSavedPolicy(undefined)
                  setSaved(false)
                  setPolicySaveError(undefined)
                }}
              >
                <option value="">{t('securityConsole.selectOrganization')}</option>
                {(organizationOptions.value ?? []).map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </SelectField>
            </div>
          )}
        </div>
      </div>
      {isPlatform && organizationOptions.loading && <p role="status">{t('app.loading')}</p>}
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
