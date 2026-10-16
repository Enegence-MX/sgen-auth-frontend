import { useCallback, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices } from '../services/services-context'
import { useResource } from '../hooks/use-resource'
import { passwordLength } from '../../features/passwords/model/password-policy'
import { ApiError } from '../../shared/api/errors'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Card } from '../../shared/ui/Card'
import { Notice } from '../../shared/ui/Notice'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { TextField } from '../../shared/ui/TextField'
import { Button } from '../../shared/ui/Button'
import { Spinner } from '../../shared/ui/Loading'

export function PasswordPage() {
  const { t } = useTranslation()
  const { auth, passwords } = useServices()
  const navigate = useNavigate()
  const load = useCallback((signal: AbortSignal) => passwords.policy(signal), [passwords])
  const resource = useResource(load)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [mismatch, setMismatch] = useState(false)
  const state = resource.value

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!state || busy) return
    setError(undefined)
    setMismatch(false)
    if (newPassword !== confirmation) { setMismatch(true); return }
    const length = passwordLength(newPassword)
    if (length < state.policy.minimumLength || length > state.policy.maximumLength) {
      setError(new ApiError(422, length < state.policy.minimumLength ? 'PASSWORD_TOO_SHORT' : 'PASSWORD_TOO_LONG'))
      return
    }
    setBusy(true)
    try {
      await passwords.change(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
      auth.passwordChanged()
      await navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (failure) {
      setError(failure)
    } finally { setBusy(false) }
  }

  return (
    <section className="grid min-w-0 gap-6">
      <PageHeader title={t('password.title')} description={t('password.description')} />
      {resource.error !== undefined && <ErrorNotice error={resource.error} />}
      {!state && resource.error === undefined && <Spinner label={t('app.loading')} />}
      {state && <>
        {state.changeRequired && <Notice variant="warning">{t('password.required')}</Notice>}
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
          <Card>
            <form className="grid min-w-0 gap-3" onSubmit={(event) => { void submit(event) }}>
              <TextField label={t('password.current')} type="password" autoComplete="current-password" required disabled={busy} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              <TextField label={t('password.next')} type="password" autoComplete="new-password" required disabled={busy} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <p className="m-0 text-sm text-body" aria-live="polite">{t('password.count', { count: passwordLength(newPassword) })}</p>
              <TextField label={t('password.confirmation')} type="password" autoComplete="new-password" required disabled={busy} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} error={mismatch ? t('password.mismatch') : undefined} />
              {error !== undefined && <ErrorNotice error={error} />}
              <p className="text-sm leading-relaxed text-body">{t('password.signInAgain')}</p>
              <Button type="submit" loading={busy}>{t(busy ? 'password.submitting' : 'password.submit')}</Button>
            </form>
          </Card>
          <Card>
            <h2 className="m-0 font-heading text-lg font-semibold text-ink">{t('password.rules')}</h2>
            <ul className="mt-4 grid gap-3 pl-5 leading-relaxed">
              <li>{t('password.length', { min: state.policy.minimumLength, max: state.policy.maximumLength })}</li>
              <li>{t('password.phrases')}</li>
              <li>{t('password.history', { count: state.policy.historyCount })}</li>
              <li>{t('password.blocked')}</li>
              <li>{state.policy.expiryDays === null ? t('password.noExpiry') : t('password.expiry', { count: state.policy.expiryDays })}</li>
            </ul>
          </Card>
        </div>
      </>}
    </section>
  )
}
