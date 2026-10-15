import { useCallback } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { useResource } from '../hooks/use-resource'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Notice } from '../../shared/ui/Notice'
import { Button } from '../../shared/ui/Button'
import { isRecord } from '../../shared/api/response'
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
    <section>
      {platform && <Link to="/organizations">{t('app.back')}</Link>}
      {result.loading && <p role="status">{t('app.loading')}</p>}
      {result.error !== undefined && (
        <>
          <h1>{t('modules.organization')}</h1>
          <ErrorNotice error={result.error} />
          <Button onClick={result.retry}>{t('app.retry')}</Button>
        </>
      )}
      {item && (
        <>
          <div className={styles.heading}>
            <div>
              <h1>{item.razonSocial}</h1>
              <p>{item.rfcMaestro}</p>
            </div>
            <span className={styles.badge} data-active={item.active}>
              {t(item.active ? 'organizations.active' : 'organizations.inactive')}
            </span>
          </div>
          {created && <Notice role="status">{t('organizations.created')}</Notice>}
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
