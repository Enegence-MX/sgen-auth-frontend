// Visual placeholder; the active sign-in flow uses AuthStepContent.
import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import styles from '../../../app/pages/AuthPage.module.css'

export function MfaVerification({ onVerify }: Readonly<{ onVerify?: (code: string) => void }>) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length === 6) onVerify?.(code)
  }

  return (
    <div className={styles.stepContainer}>
      <h1 className={styles.title}>{t('invitation.mfaHeading')}</h1>
      <form onSubmit={handleSubmit}>
        <TextField label={t('auth.mfaCode')} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center font-mono text-2xl tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
        <Button type="submit" disabled={code.length !== 6} className="w-full">{t('auth.verifyCode')}</Button>
      </form>
    </div>
  )
}
