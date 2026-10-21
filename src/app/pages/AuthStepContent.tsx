import type { TFunction } from 'i18next'
import type { Credentials } from '../../features/auth/model/credentials'
import type { MfaChallenge } from '../../features/auth/model/mfa-challenge'
import type { TenantChoice } from '../../features/auth/model/session'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { SelectField } from '../../shared/ui/SelectField'
import styles from './AuthPage.module.css'

interface AuthStepContentProps {
  t: TFunction
  choices: TenantChoice[]
  step: 'email' | 'password' | 'mfa'
  credentials: Credentials
  tenantId: string
  mfaChallenge?: MfaChallenge
  mfaCode: string
  busy: boolean
  showPassword: boolean
  actionLabel: string
  onCancel: () => void
  onBackToEmail: () => void
  onTenantChange: (tenantId: string) => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onCodeChange: (code: string) => void
  onTogglePassword: () => void
}

export function AuthStepContent({
  t,
  choices,
  step,
  credentials,
  tenantId,
  mfaChallenge,
  mfaCode,
  busy,
  showPassword,
  actionLabel,
  onCancel,
  onBackToEmail,
  onTenantChange,
  onEmailChange,
  onPasswordChange,
  onCodeChange,
  onTogglePassword,
}: Readonly<AuthStepContentProps>) {
  if (choices.length) {
    return (
      <div className={styles.stepContainer}>
        <Button variant="ghost" onClick={onCancel} className="self-start break-all text-left"><ArrowLeft size={16} aria-hidden="true" />{credentials.email}</Button>
        <div className={styles.headerBox}>
          <h1 className={styles.title}>{t('auth.tenantHeading')}</h1>
          <p className={styles.subtitle}>{t('auth.tenantHint')}</p>
        </div>
        <div>
          <SelectField id="tenant-choice" label={t('auth.tenantLabel')} value={tenantId} onChange={(event) => onTenantChange(event.target.value)} required>
            <option value="">{t('auth.tenantPlaceholder')}</option>
            {choices.map((item) => <option key={item.tenantId} value={item.tenantId}>{item.legalName}</option>)}
          </SelectField>
        </div>
        <Button type="submit" loading={busy} disabled={!tenantId}>{busy ? t('auth.processing') : actionLabel}</Button>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div className={styles.stepContainer}>
        <div className={styles.headerBox}>
          <h1 className={styles.title}>{t('auth.loginStep1Title')}</h1>
          <p className={styles.subtitle}>{t('auth.loginStep1Subtitle')}</p>
        </div>
        <div>
          <TextField id="emailInput" label={t('auth.emailLabel')} type="email" autoComplete="username" placeholder={t('auth.emailPlaceholder')} value={credentials.email} onChange={(event) => onEmailChange(event.target.value)} required />
        </div>
        <Button type="submit" disabled={!credentials.email.trim()}>{t('auth.continueEmail')}</Button>
      </div>
    )
  }

  if (step === 'password') {
    return (
      <div className={styles.stepContainer}>
        <Button variant="ghost" onClick={onBackToEmail} className="self-start break-all text-left"><ArrowLeft size={16} aria-hidden="true" />{credentials.email}</Button>
        <h1 className={styles.title}>{t('auth.loginStep2Title')}</h1>
        <div className="relative">
          <TextField id="pwdInput" label={t('auth.passwordLabel')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-14" value={credentials.password} onChange={(event) => onPasswordChange(event.target.value)} required />
          <Button size="icon" variant="ghost" onClick={onTogglePassword} aria-label={t(showPassword ? 'app.hidePassword' : 'app.showPassword')} aria-pressed={showPassword} className="absolute top-8 right-1">
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </Button>
        </div>
        <Button type="submit" loading={busy} disabled={credentials.password.length === 0}>{busy ? t('auth.processing') : t('auth.loginButton')}</Button>
      </div>
    )
  }

  return (
    <div className={styles.stepContainer}>
      <Button variant="ghost" onClick={onCancel} className="self-start"><ArrowLeft size={16} aria-hidden="true" />{t('app.back')}</Button>
      <div className={styles.headerBox}>
        <h1 className={styles.title}>{t('auth.mfaTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.mfaSubtitle', { email: mfaChallenge?.sentTo ?? credentials.email })}</p>
      </div>
      <div>
        <TextField id="mfaCode" label={t('auth.mfaCode')} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="text-center font-mono text-2xl tracking-[0.3em]" value={mfaCode} onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, ''))} required />
      </div>
      <Button type="submit" loading={busy} disabled={mfaCode.length !== 6}>{busy ? t('auth.processing') : t('auth.verifyCode')}</Button>
    </div>
  )
}
