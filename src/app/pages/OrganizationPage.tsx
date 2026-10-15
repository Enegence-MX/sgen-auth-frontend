import { useCallback } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { useResource } from '../hooks/use-resource'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { Button } from '../../shared/ui/Button'
import { isRecord } from '../../shared/api/response'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../shared/ui/Badge'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Spinner } from '../../shared/ui/Loading'
import styles from './Workspace.module.css'

export function OrganizationPage() {
  const { t, i18n } = useTranslation()
  const { id = '' } = useParams()
  const { organizations } = useServices()
  const state = useSession()
  const location = useLocation()
  const load = useCallback((signal: AbortSignal) => organizations.detail(id, signal), [organizations, id])
  const result = useResource(load)
  const platform = state.session?.context.accessMode === 'PLATFORM_SUPERADMIN'
  const item = result.value
  const created = isRecord(location.state) && location.state.created === true
  return (
    <section className="grid min-w-0 gap-6">
      {platform && <Link to="/organizations" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold no-underline hover:underline"><ArrowLeft size={16} aria-hidden="true" />{t('app.back')}</Link>}
      {result.loading && <Spinner label={t('app.loading')} />}
      {result.error !== undefined && (
        <>
          <h1>{t('modules.organization')}</h1>
          <ErrorNotice error={result.error} />
          <Button onClick={result.retry}>{t('app.retry')}</Button>
        </>
      )}
      {item && (
        <>
          <PageHeader title={item.razonSocial} description={item.rfcMaestro} actions={
            <Badge variant={item.active ? 'success' : 'warning'}>{t(item.active ? 'organizations.active' : 'organizations.inactive')}</Badge>
          } />
          {created && <Notice variant="success" role="status">{t('organizations.created')}</Notice>}
          <dl className={styles.details}>
            <div>
              <dt>{t('organizations.sector')}</dt>
              <dd>{item.sectorIndustrial || t('organizations.noData')}</dd>
            </div>
            <div>
              <dt>{t('organizations.address')}</dt>
              <dd>{item.domicilioFiscal || t('organizations.noData')}</dd>
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
          {created && <Notice>{t('organizations.createLimit')}</Notice>}
        </>
      )}
    </section>
  )
}
