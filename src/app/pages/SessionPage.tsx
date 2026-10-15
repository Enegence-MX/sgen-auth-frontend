import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { Button } from '../../shared/ui/Button'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { LanguageSelector } from '../../shared/ui/LanguageSelector'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'
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
    <section className="grid min-w-0 gap-6">
      <PageHeader title={t('session.title')} description={t('session.description')} actions={
        <Button variant="secondary" loading={busy} onClick={() => { void renew() }}>{busy ? t('session.renewing') : t('session.renew')}</Button>
      } />
      {error !== undefined && <ErrorNotice error={error} />}
      {renewed && <Notice variant="success" role="status">{t('session.renewed')}</Notice>}
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
          <dt className="sr-only">{t('app.language')}</dt>
          <dd>
            <LanguageSelector />
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t('app.theme')}</dt>
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
      <Card>
        <h2 className="m-0 font-heading text-lg font-semibold text-ink">{t('session.permissions')}</h2>
        <p className="mt-2 mb-5 text-sm">{t('session.readOnly')}</p>
        {platform ? (
          <Notice>{t('session.platformPermissions')}</Notice>
        ) : (
          <PermissionList permissions={session.permissions} />
        )}
      </Card>
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
