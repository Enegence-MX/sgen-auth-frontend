import { useCallback, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { isPlatform, isTenant, type Session } from '../../features/auth/model/session'
import { useResource } from '../hooks/use-resource'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { Button } from '../../shared/ui/Button'
import { isRecord } from '../../shared/api/response'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Badge } from '../../shared/ui/Badge'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Spinner } from '../../shared/ui/Loading'
import { OrganizationProfileForm } from '../../features/organizations/components/OrganizationProfileForm'
import { OrganizationStatusDialog } from '../../features/organizations/components/OrganizationStatusDialog'
import type { Organization } from '../../features/organizations/model/organization'
import styles from './Workspace.module.css'

const canEditProfile = (session: Session | null) =>
  session !== null &&
  (isPlatform(session) ||
    (isTenant(session) && session.permissions.some(({ code }) => code === 'MANAGE_ORGANIZATION_PROFILE')))

export function OrganizationPage() {
  const { t, i18n } = useTranslation()
  const { id = '' } = useParams()
  const { organizations } = useServices()
  const state = useSession()
  const location = useLocation()
  const load = useCallback((signal: AbortSignal) => organizations.detail(id, signal), [organizations, id])
  const result = useResource(load)
  const [changed, setChanged] = useState<{ item: Organization; message: 'updated' | 'statusChanged' }>()
  const [editing, setEditing] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [actionError, setActionError] = useState<unknown>()
  const platform = state.session ? isPlatform(state.session) : false
  const canEdit = canEditProfile(state.session)
  const item = changed?.item.id === id ? changed.item : result.value
  const created = isRecord(location.state) && location.state.created === true

  function saved(organization: Organization, message: 'updated' | 'statusChanged') {
    setChanged({ item: organization, message })
    setEditing(false)
    setActionError(undefined)
  }
  function conflict(error: unknown) {
    setActionError(error)
    setChanged(undefined)
    result.retry()
  }

  return (
    <section className="grid min-w-0 gap-6">
      {platform && <Link to="/organizations" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold no-underline hover:underline"><ArrowLeft size={16} aria-hidden="true" />{t('app.back')}</Link>}
      {result.loading && !item && <Spinner label={t('app.loading')} />}
      {result.error !== undefined && (
        <>
          <h1>{t('modules.organization')}</h1>
          <ErrorNotice error={result.error} />
          <Button onClick={result.retry}>{t('app.retry')}</Button>
        </>
      )}
      {item && (
        <>
          <PageHeader title={item.legalName} description={item.rfc} actions={
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={item.active ? 'success' : 'warning'}>{t(item.active ? 'organizations.active' : 'organizations.suspended')}</Badge>
              {canEdit && !editing && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} aria-hidden="true" />{t('organizations.edit')}</Button>}
              {platform && <Button variant="secondary" onClick={() => setStatusOpen(true)}>{t(item.active ? 'organizations.suspend' : 'organizations.reactivate')}</Button>}
            </div>
          } />
          {created && <Notice variant="success" role="status">{t('organizations.created')}</Notice>}
          {changed?.item.id === id && <Notice variant="success" role="status">{t(`organizations.${changed.message}`)}</Notice>}
          {actionError !== undefined && <ErrorNotice error={actionError} />}
          {editing && canEdit ? (
            <OrganizationProfileForm
              organization={item}
              canEditLegalName={platform}
              onSaved={(organization) => saved(organization, 'updated')}
              onCancel={() => setEditing(false)}
              onError={setActionError}
            />
          ) : (
            <dl className={styles.details}>
              <div>
                <dt>{t('organizations.sector')}</dt>
                <dd>{item.industrySector || t('organizations.noData')}</dd>
              </div>
              <div>
                <dt>{t('organizations.address')}</dt>
                <dd>{item.taxAddress || t('organizations.noData')}</dd>
              </div>
              <div>
                <dt>{t('organizations.createdAt')}</dt>
                <dd>{new Date(item.createdAt).toLocaleString(i18n.resolvedLanguage)}</dd>
              </div>
              <div>
                <dt>{t('organizations.updatedAt')}</dt>
                <dd>{new Date(item.updatedAt).toLocaleString(i18n.resolvedLanguage)}</dd>
              </div>
            </dl>
          )}
          {created && <Notice>{t('organizations.createLimit')}</Notice>}
          {platform && (
            <OrganizationStatusDialog
              organization={item}
              open={statusOpen}
              onOpenChange={setStatusOpen}
              onChanged={(organization) => saved(organization, 'statusChanged')}
              onConflict={conflict}
            />
          )}
        </>
      )}
    </section>
  )
}
