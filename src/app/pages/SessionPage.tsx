import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { Button } from '../../shared/ui/Button'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { LanguageSelector } from '../../shared/ui/LanguageSelector'
import { ThemeSelector } from '../../shared/ui/ThemeSelector'
import styles from './Workspace.module.css'

export function SessionPage() {
  const { t } = useTranslation()
  const { auth } = useServices()
  const state = useSession()
  const [busy, setBusy] = useState(false)
  const [renewed, setRenewed] = useState(false)
  const [error, setError] = useState<unknown>()
  async function renew() {
    setBusy(true)
    setError(undefined)
    setRenewed(false)
    try {
      await auth.refresh()
      setRenewed(true)
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }
  if (state.status !== 'authenticated') return null
  const { session } = state
  const platform = session.context.accessMode === 'PLATFORM_SUPERADMIN'
  return (
    <section>
      <div className={styles.heading}>
        <div>
          <h1>{t('session.title')}</h1>
          <p>{t('session.description')}</p>
        </div>
        <Button
          disabled={busy}
          onClick={() => {
            void renew()
          }}
        >
          {busy ? t('session.renewing') : t('session.renew')}
        </Button>
      </div>
      {error !== undefined && <ErrorNotice error={error} />}
      {renewed && <Notice role="status">{t('session.renewed')}</Notice>}
      <dl className={styles.details}>
        <div>
          <dt>{t('session.name')}</dt>
          <dd>{session.identity.name}</dd>
        </div>
        <div>
          <dt>{t('session.email')}</dt>
          <dd>{session.identity.email}</dd>
        </div>
        <div>
          <dt>{t('session.mode')}</dt>
          <dd>{t(platform ? 'auth.platform' : 'auth.tenant')}</dd>
        </div>
        <div>
          <dt>{t('app.language')}</dt>
          <dd>
            <LanguageSelector />
          </dd>
        </div>
        <div>
          <dt>Tema</dt>
          <dd>
            <ThemeSelector />
          </dd>
        </div>
        {session.context.organization && (
          <div>
            <dt>{t('session.organization')}</dt>
            <dd>
              <Link to={`/organizations/${session.context.organization.id}`}>{session.context.organization.legalName}</Link>
            </dd>
          </div>
        )}
      </dl>
      <h2>{t('session.permissions')}</h2>
      <p>{t('session.readOnly')}</p>
      {platform ? (
        <Notice>{t('session.platformPermissions')}</Notice>
      ) : (
        <PermissionList permissions={session.permissions} />
      )}
    </section>
  )
}
function PermissionList({ permissions }: Readonly<{ permissions: { module: string; code: string }[] }>) {
  const { t } = useTranslation()
  if (!permissions.length) return <Notice>{t('session.noPermissions')}</Notice>
  return (
    <ul className={styles.permissions}>
      {permissions.map((permission) => (
        <li key={`${permission.module}:${permission.code}`}>
          <span>{permission.module}</span>
          <strong>{permission.code}</strong>
        </li>
      ))}
    </ul>
  )
}
