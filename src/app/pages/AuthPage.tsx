import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { tenantChoices, type TenantChoice } from '../../features/auth/model/session'
import type { MfaChallenge } from '../../features/auth/model/mfa-challenge'
import { Spinner } from '../../shared/ui/Loading'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { useServices, useSession } from '../services/services-context'
import { AuthStepContent } from './AuthStepContent'
import styles from './AuthPage.module.css'

export function AuthPage() {
  const { t } = useTranslation()
  const { auth } = useServices()
  const state = useSession()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [choices, setChoices] = useState<TenantChoice[]>([])
  const [tenantId, setTenantId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [step, setStep] = useState<'email' | 'password' | 'mfa'>('email')
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge>()
  const [mfaCode, setMfaCode] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleContinueEmail = () => {
    if (!credentials.email.trim()) return
    setStep('password')
  }

  const handleBackToEmail = () => {
    setStep('email')
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    if (step === 'mfa' && mfaChallenge) {
      try {
        await auth.verifyMfa(mfaChallenge.challengeToken, mfaCode)
        setMfaChallenge(undefined)
        setMfaCode('')
      } catch (failure) {
        setError(failure)
      } finally {
        setBusy(false)
      }
      return
    }
    try {
      const challenge = await auth.login(credentials, tenantId || undefined)
      if (challenge) {
        setMfaChallenge(challenge)
        setMfaCode('')
        setCredentials((current) => ({ ...current, password: '' }))
        setStep('mfa')
        return
      }
      setCredentials({ email: '', password: '' })
      setChoices([])
      setStep('email')
    } catch (failure) {
      const tenants = tenantChoices(failure)
      if (tenants.length) {
        setChoices(tenants)
        setTenantId('')
      } else {
        setError(failure)
        setChoices([])
        setTenantId('')
        setCredentials((current) => ({ ...current, password: '' }))
        setStep('password')
      }
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    setChoices([])
    setTenantId('')
    setCredentials((current) => ({ ...current, password: '' }))
    setMfaChallenge(undefined)
    setMfaCode('')
    setError(undefined)
    setStep('email')
  }

  const actionLabel = choices.length ? t('auth.continue') : t('auth.loginButton')

  if (state.status === 'authenticated') return <Navigate to="/organizations" replace />
  if (state.status === 'loading')
    return (
      <main className={styles.panel}>
        <Spinner label={t('app.loading')} />
      </main>
    )

  return (
    <main className={styles.panel}>
      <img src="/assets/logo-completo.png" alt="Enegence" className={styles.logo} onError={(e) => e.currentTarget.style.display = 'none'} />
      <form aria-label={t('auth.loginForm')} onSubmit={step === 'email' && choices.length === 0 ? (e) => { e.preventDefault(); handleContinueEmail(); } : submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          <AuthStepContent
            t={t}
            choices={choices}
            step={step}
            credentials={credentials}
            tenantId={tenantId}
            mfaChallenge={mfaChallenge}
            mfaCode={mfaCode}
            busy={busy}
            showPassword={showPwd}
            actionLabel={actionLabel}
            onCancel={cancel}
            onBackToEmail={handleBackToEmail}
            onTenantChange={setTenantId}
            onEmailChange={(email) => setCredentials((current) => ({ ...current, email }))}
            onPasswordChange={(password) => setCredentials((current) => ({ ...current, password }))}
            onCodeChange={(code) => { setMfaCode(code); setError(undefined) }}
            onTogglePassword={() => setShowPwd((visible) => !visible)}
          />
        </fieldset>
      </form>
      {error !== undefined && <ErrorNotice error={error} />}
      {state.status === 'error' && error === undefined && <ErrorNotice error={state.error} />}
    </main>
  )
}
