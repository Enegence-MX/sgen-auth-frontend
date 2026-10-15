import type { TFunction } from 'i18next'
import type { Credentials } from '../../features/auth/model/credentials'
import type { MfaChallenge } from '../../features/auth/model/mfa-challenge'
import type { TenantChoice } from '../../features/auth/model/session'
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
        <button type="button" onClick={onCancel} className={styles.backButton}>&larr; {credentials.email}</button>
        <h1 className={styles.title} style={{ textAlign: 'left', margin: 0 }}>{t('auth.tenantHeading')}</h1>
        <p className={styles.subtitle} style={{ textAlign: 'left' }}>{t('auth.tenantHint')}</p>
        <div className={styles.inputGroup}>
          <label htmlFor="tenant-choice" className={styles.label}>{t('auth.tenantLabel')}</label>
          <select
            id="tenant-choice"
            value={tenantId}
            onChange={(event) => onTenantChange(event.target.value)}
            required
            className={styles.input}
          >
            <option value="">{t('auth.tenantPlaceholder')}</option>
            {choices.map((item) => (
              <option key={item.tenantId} value={item.tenantId}>{item.legalName}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.buttonPrimary} disabled={busy || !tenantId}>
          {busy ? t('auth.processing') : actionLabel}
        </button>
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
        <div className={styles.inputGroup}>
          <label htmlFor="emailInput" className={styles.label}>{t('auth.emailLabel')}</label>
          <input
            id="emailInput"
            type="email"
            autoComplete="username"
            placeholder="nombre@empresa.com"
            className={styles.input}
            value={credentials.email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.buttonPrimary} disabled={!credentials.email.trim()}>
          {t('auth.continueEmail')}
        </button>
      </div>
    )
  }

  if (step === 'password') {
    return (
      <div className={styles.stepContainer}>
        <button type="button" onClick={onBackToEmail} className={styles.backButton}>&larr; {credentials.email}</button>
        <h1 className={styles.title} style={{ textAlign: 'left', margin: 0 }}>{t('auth.loginStep2Title')}</h1>
        <div className={styles.inputGroup}>
          <label htmlFor="pwdInput" className={styles.label}>{t('auth.passwordLabel')}</label>
          <div style={{ position: 'relative' }}>
            <input
              id="pwdInput"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={styles.input}
              style={{ paddingRight: '48px', width: '100%', boxSizing: 'border-box' }}
              value={credentials.password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label="Mostrar u ocultar contraseña"
              className={styles.togglePwdButton}
              style={{ position: 'absolute', right: '4px', top: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6178" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
        <button type="submit" className={styles.buttonPrimary} disabled={busy || !credentials.password.trim()}>
          {busy ? t('auth.processing') : t('auth.loginButton')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.stepContainer}>
      <button type="button" onClick={onCancel} className={styles.backButton}>{t('app.back')}</button>
      <h1 className={styles.title} style={{ textAlign: 'left', margin: 0 }}>{t('auth.mfaTitle')}</h1>
      <p className={styles.subtitle} style={{ textAlign: 'left' }}>
        {t('auth.mfaSubtitle', { email: mfaChallenge?.sentTo ?? credentials.email })}
      </p>
      <div className={styles.inputGroup}>
        <label htmlFor="mfaCode" className={styles.label}>{t('auth.mfaCode')}</label>
        <input
          id="mfaCode"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          className={styles.input}
          value={mfaCode}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, ''))}
          required
        />
      </div>
      <button type="submit" className={styles.buttonPrimary} disabled={busy || mfaCode.length !== 6}>
        {busy ? t('auth.processing') : t('auth.verifyCode')}
      </button>
    </div>
  )
}
