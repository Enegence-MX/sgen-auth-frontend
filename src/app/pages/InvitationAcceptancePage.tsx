import { useCallback, useState, type SubmitEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices } from '../services/services-context'
import { useResource } from '../hooks/use-resource'
import { Check } from 'lucide-react'
import { Radio } from '../../shared/ui/Checkbox'
import { LinkButton } from '../../shared/ui/LinkButton'
import { Spinner } from '../../shared/ui/Loading'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { TextField } from '../../shared/ui/TextField'
import { PASSWORD_MAX_LENGTH, passwordLength } from '../../features/passwords/model/password-policy'
import type {
  InvitationAcceptance,
  InvitationDetails,
  MfaChoice,
} from '../../features/invitations/model/invitation'

type Step = 'password' | 'mfa' | 'done'

function validateInvitationPassword(
  name: string,
  password: string,
  confirmation: string,
  minimumLength: number,
):
  | { key: 'invitation.nameRequired' }
  | { key: 'invitation.passwordHint'; options: { count: number; max: number } }
  | { key: 'invitation.passwordMismatch' }
  | { key: 'errors.passwordTooLong' }
  | undefined {
  if (!name.trim()) return { key: 'invitation.nameRequired' }
  if (passwordLength(password) < minimumLength)
    return {
      key: 'invitation.passwordHint',
      options: { count: minimumLength, max: PASSWORD_MAX_LENGTH },
    }
  if (passwordLength(password) > PASSWORD_MAX_LENGTH) return { key: 'errors.passwordTooLong' }
  if (password !== confirmation) return { key: 'invitation.passwordMismatch' }
  return undefined
}

export function InvitationAcceptancePage() {
  const { t, i18n } = useTranslation()
  const { token = '' } = useParams()
  const { invitations } = useServices()
  const loadInvitation = useCallback(
    (signal: AbortSignal) => invitations.lookup(token, signal),
    [invitations, token],
  )
  const invitationResource = useResource(loadInvitation)
  const invitation = invitationResource.value
  const [step, setStep] = useState<Step>()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [mfaChoice, setMfaChoice] = useState<MfaChoice>('ENABLE')
  const [formError, setFormError] = useState('')
  const [acceptanceError, setAcceptanceError] = useState<unknown>()
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState<InvitationAcceptance>()

  const startStep = (details: InvitationDetails): Step => {
    if (!details.hasAccount) return 'password'
    return 'mfa'
  }
  const currentStep = step ?? (invitation ? startStep(invitation) : undefined)

  async function accept(details: InvitationDetails, choice?: MfaChoice) {
    setAccepting(true)
    setAcceptanceError(undefined)
    try {
      const result = await invitations.accept({
        token,
        ...(!details.hasAccount ? { fullName: fullName.trim(), password } : {}),
        ...(choice ? { mfa: choice } : {}),
      })
      setAccepted(result)
      setPassword('')
      setPasswordConfirmation('')
      setStep('done')
    } catch (error) {
      setAcceptanceError(error)
    } finally {
      setAccepting(false)
    }
  }

  function submitPassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!invitation) return
    const validation = validateInvitationPassword(
      fullName,
      password,
      passwordConfirmation,
      invitation.passwordMinLength,
    )
    if (validation) {
      setFormError(
        String(t(validation.key, 'options' in validation ? validation.options : undefined)),
      )
      return
    }
    setFormError('')
    setStep('mfa')
  }

  function submitMfa(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (invitation) void accept(invitation, invitation.mfaRequired ? undefined : mfaChoice)
  }

  const expiryLabel = invitation
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(invitation.expiresAt))
    : ''

  const steps: Step[] = ['password', 'mfa', 'done']
  const currentStepIndex = steps.indexOf(
    currentStep ?? (invitation?.hasAccount ? 'mfa' : 'password'),
  )
  const stepLabels = [
    t('invitation.stepPassword'),
    t('invitation.stepMfa'),
    t('invitation.stepDone'),
  ]
  let mfaSubmitLabel: string =
    mfaChoice === 'WAIVE' ? t('invitation.accept') : t('invitation.activateAndAccept')
  if (accepting) mfaSubmitLabel = t('invitation.accepting')

  return (
    <div className="min-h-dvh bg-canvas text-body">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-line bg-panel px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/assets/logo-simbolo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="font-heading text-lg font-bold text-ink">{t('app.name')}</span>
          <span
            className="hidden h-6 border-0 border-l border-solid border-line sm:block"
            aria-hidden="true"
          />
          <span className="hidden text-sm text-body sm:block">{t('invitation.header')}</span>
        </div>
        <ol
          aria-label={t('invitation.progress')}
          className="m-0 flex list-none flex-wrap items-center gap-2 p-0"
        >
          {stepLabels.map((label, index) => {
            const complete = index < currentStepIndex
            const current = index === currentStepIndex
            let progressClass = 'text-muted'
            let markerClass = 'bg-subtle text-muted'
            if (current) {
              progressClass = 'bg-brand-soft text-brand'
              markerClass = 'bg-brand text-on-brand'
            } else if (complete) {
              progressClass = 'text-positive'
              markerClass = 'bg-positive-surface text-positive'
            }
            return (
              <li
                key={label}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${progressClass}`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[11px] ${markerClass}`}
                >
                  {complete ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                {label}
              </li>
            )
          })}
        </ol>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.9fr)] lg:gap-8 lg:py-10">
        <section className="grid min-w-0 gap-5">
          {invitationResource.loading && (
            <Card>
              <Spinner label={t('invitation.loading')} />
            </Card>
          )}
          {invitationResource.error !== undefined && (
            <Card className="grid min-w-0 grid-cols-1 gap-4">
              <ErrorNotice error={invitationResource.error} />
              <Button variant="secondary" onClick={invitationResource.retry}>
                {t('app.retry')}
              </Button>
            </Card>
          )}

          {invitation && invitation.status !== 'PENDING' && (
            <Card>
              <Notice variant="warning">{t('invitation.notPending')}</Notice>
              <Link className="mt-4 inline-block font-semibold text-brand underline" to="/login">
                {t('invitation.goToLogin')}
              </Link>
            </Card>
          )}

          {invitation?.status === 'PENDING' && currentStep === 'password' && (
            <Card>
              <h1 className="m-0 font-heading text-2xl font-semibold text-ink">
                {t('invitation.createAccount')}
              </h1>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-body">
                {t('invitation.createAccountHint')}
              </p>
              <form className="grid min-w-0 grid-cols-1 gap-4" onSubmit={submitPassword}>
                <div><TextField
                  label={t('invitation.fullName')}
                  autoComplete="name"
                  maxLength={255}
                  required
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value)
                    setFormError('')
                  }}
                /></div>
                <div><TextField
                  label={t('invitation.password')}
                  type="password"
                  autoComplete="new-password"
                  hint={t('invitation.passwordHint', {
                    count: invitation.passwordMinLength,
                    max: PASSWORD_MAX_LENGTH,
                  })}
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFormError('')
                  }}
                /></div>
                <div><TextField
                  label={t('invitation.confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  onChange={(event) => {
                    setPasswordConfirmation(event.target.value)
                    setFormError('')
                  }}
                /></div>
                {formError && (
                  <Notice variant="error" role="alert">
                    {formError}
                  </Notice>
                )}
                <Button type="submit">{t('invitation.continue')}</Button>
              </form>
            </Card>
          )}

          {invitation?.status === 'PENDING' && currentStep === 'mfa' && (
            <Card>
              <h1 className="m-0 font-heading text-2xl font-semibold text-ink">
                {t('invitation.mfaHeading')}
              </h1>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-body">
                {invitation.hasAccount
                  ? t('invitation.existingAccountHint')
                  : t('invitation.mfaSetupHint')}
              </p>
              <form className="grid min-w-0 grid-cols-1 gap-5" onSubmit={submitMfa}>
                {!invitation.mfaWaiver || invitation.mfaRequired ? (
                  <Notice>
                    {invitation.hasMfa ? t('invitation.mfaEnabled') : t('invitation.mfaRequired')}
                  </Notice>
                ) : (
                  <>
                    <fieldset className="m-0 grid gap-3 border-0 p-0">
                      <legend className="mb-1 text-sm font-semibold text-ink">
                        {t('invitation.mfaChoice')}
                      </legend>
                      <Radio name="invitation-mfa-choice" value="ENABLE" checked={mfaChoice === 'ENABLE'} onChange={() => setMfaChoice('ENABLE')} label={t('invitation.mfaEnable')} containerClassName="rounded-control border border-solid border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft" />
                      <Radio name="invitation-mfa-choice" value="WAIVE" checked={mfaChoice === 'WAIVE'} onChange={() => setMfaChoice('WAIVE')} label={t('invitation.mfaWaive')} containerClassName="rounded-control border border-solid border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft" />
                    </fieldset>
                    {mfaChoice === 'WAIVE' && (
                      <Notice variant="warning">{invitation.mfaWaiver.text}</Notice>
                    )}
                  </>
                )}

                {mfaChoice !== 'WAIVE' && (
                  <fieldset className="m-0 grid gap-3 border-0 p-0">
                    <legend className="mb-1 text-sm font-semibold text-ink">
                      {t('invitation.mfaMethod')}
                    </legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Radio name="invitation-mfa-method" value="EMAIL" checked readOnly label={t('invitation.emailMethod')} description={t('invitation.emailMethodHint')} containerClassName="rounded-control border border-solid border-brand bg-brand-soft p-3" />
                      <Radio name="invitation-mfa-method" value="TOTP" disabled label={t('invitation.authenticatorApp')} description={t('invitation.authenticatorAppComingSoon')} containerClassName="rounded-control border border-solid border-line bg-panel p-3" />
                    </div>
                  </fieldset>
                )}

                {acceptanceError !== undefined && <ErrorNotice error={acceptanceError} />}
                {!invitation.hasAccount && currentStep === 'mfa' && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStep('password')
                      setAcceptanceError(undefined)
                    }}
                  >
                    {t('invitation.backToPassword')}
                  </Button>
                )}
                <Button
                  type="submit"
                  loading={accepting}
                >
                  {mfaSubmitLabel}
                </Button>
              </form>
            </Card>
          )}

          {currentStep === 'done' && accepted && (
            <Card className="grid min-w-0 grid-cols-1 gap-4">
              <Notice variant="success" role="status">
                {t('invitation.success')}
              </Notice>
              <div>
                <h1 className="m-0 font-heading text-2xl font-semibold text-ink">
                  {t('invitation.accountActivated')}
                </h1>
                <p className="mt-2 mb-0 break-all text-sm text-body">
                  {accepted.legalName} · {accepted.email}
                </p>
              </div>
              <p className="m-0 text-sm leading-relaxed text-body">
                {t(
                  accepted.mfa === 'ENABLED' ? 'invitation.successMfa' : 'invitation.successNoMfa',
                )}
              </p>
              <LinkButton to="/login">{t('invitation.goToLogin')}</LinkButton>
            </Card>
          )}
        </section>

        {invitation && <InvitationSummary invitation={invitation} expiryLabel={expiryLabel} />}
      </main>
    </div>
  )
}

function InvitationSummary({
  invitation,
  expiryLabel,
}: Readonly<{ invitation: InvitationDetails; expiryLabel: string }>) {
  const { t } = useTranslation()
  let passwordExpiryLabel = '—'
  if (invitation.passwordExpiryDays === null) passwordExpiryLabel = t('password.noExpiry')
  else if (invitation.passwordExpiryDays !== undefined) {
    passwordExpiryLabel = t('invitation.passwordDays', {
      count: invitation.passwordExpiryDays,
    })
  }

  return (
    <aside className="grid min-w-0 grid-cols-1 gap-4">
      <Card>
        <p className="m-0 text-xs font-bold tracking-widest text-brand uppercase">
          {t('invitation.organizationPolicy')}
        </p>
        <h2 className="mt-3 mb-5 font-heading text-lg font-semibold text-ink">
          {invitation.legalName}
        </h2>
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-body">
          <dt>{t('securityConsole.minimumLength')}</dt>
          <dd className="m-0 break-words text-right font-semibold text-ink">
            {t('invitation.passwordCharacters', { count: invitation.passwordMinLength })}
          </dd>
          <dt>{t('securityConsole.passwordExpiry')}</dt>
          <dd className="m-0 break-words text-right font-semibold text-ink">{passwordExpiryLabel}</dd>
          {invitation.passwordHistoryCount !== undefined && (
            <>
              <dt>{t('securityConsole.passwordHistory')}</dt>
              <dd className="m-0 text-right font-semibold text-ink">
                {t('invitation.passwordHistoryCount', { count: invitation.passwordHistoryCount })}
              </dd>
            </>
          )}
          <dt>{t('securityConsole.mfa')}</dt>
          <dd className="m-0 break-words text-right font-semibold text-ink">
            {invitation.mfaRequired ? t('invitation.required') : t('invitation.optional')}
          </dd>
          <dt>{t('securityConsole.authenticationMode')}</dt>
          <dd className="m-0 break-words text-right font-semibold text-ink">
            {invitation.authMode === undefined ? '—' : t(`securityConsole.authMode.${invitation.authMode}`)}
          </dd>
          <dt>{t('securityConsole.allowedMethods')}</dt>
          <dd className="m-0 text-right font-semibold text-ink">
            {invitation.mfaAllowedMethods?.length
              ? invitation.mfaAllowedMethods
                  .map((method) =>
                    t(
                      method === 'EMAIL' || method === 'EMAIL_OTP'
                        ? 'securityConsole.emailMfa'
                        : 'securityConsole.authenticatorApp',
                    ),
                  )
                  .join(', ')
              : '—'}
          </dd>
        </dl>
      </Card>
      <Card>
        <h2 className="m-0 mb-4 font-heading text-base font-semibold text-ink">
          {t('invitation.invitationDetails')}
        </h2>
        <dl className="m-0 grid gap-3 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
          <dt className="font-semibold text-muted">{t('invitation.email')}</dt>
          <dd className="m-0 break-all text-ink">{invitation.email}</dd>
          <dt className="font-semibold text-muted">{t('invitation.expires')}</dt>
          <dd className="m-0 text-ink">{expiryLabel}</dd>
        </dl>
      </Card>
    </aside>
  )
}
