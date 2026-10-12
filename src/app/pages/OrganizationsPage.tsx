import { useCallback, useState, type SubmitEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { useResource } from '../hooks/use-resource'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { Table } from '../../shared/ui/Table'
import { Badge } from '../../shared/ui/Badge'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import styles from './Workspace.module.css'

export function OrganizationsPage() {
  const state = useSession()
  if (state.status !== 'authenticated') return null
  if (state.session.context.mod !== 'SUPERADMIN_PLATAFORMA')
    return <Navigate to={`/organizations/${state.session.context.tid}`} replace />
  return <PlatformOrganizations />
}

function PlatformOrganizations() {
  const { t } = useTranslation()
  const { organizations } = useServices()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const load = useCallback(
    (signal: AbortSignal) => organizations.list(page, search, signal),
    [organizations, page, search],
  )
  const result = useResource(load)
  const totalPages = Math.max(1, Math.ceil((result.value?.meta.total ?? 0) / 10))
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(query.trim())
  }
  return (
    <section>
      <div className={styles.heading}>
        <div>
          <h1>{t('organizations.title')}</h1>
          <p>{t('organizations.description')}</p>
        </div>
        <Link className={styles.primaryLink} to="/organizations/new">
          {t('organizations.new')}
        </Link>
      </div>
      <form className={styles.search} onSubmit={submit} aria-label={t('organizations.search')}>
        <TextField
          label={t('organizations.search')}
          placeholder={t('organizations.search')}
          value={query}
          maxLength={255}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" disabled={result.loading}>
          {t('organizations.searchButton')}
        </Button>
      </form>
      {result.loading && <p role="status">{t('app.loading')}</p>}
      {result.error !== undefined && (
        <>
          <ErrorNotice error={result.error} />
          <Button onClick={result.retry}>{t('app.retry')}</Button>
        </>
      )}
      {result.value && (
        <>
          <Table caption={t('organizations.total', { count: result.value.meta.total })}>
            <thead>
              <tr>
                <th scope="col">{t('organizations.legalName')}</th>
                <th scope="col">{t('organizations.taxId')}</th>
                <th scope="col">{t('organizations.status')}</th>
                <th scope="col">{t('organizations.view')}</th>
              </tr>
            </thead>
            <tbody>
              {result.value.data.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-[450px] font-semibold text-ink [overflow-wrap:anywhere]">{item.razonSocial}</td>
                  <td>{item.rfcMaestro}</td>
                  <td>
                    <Badge variant={item.active ? 'success' : 'warning'}>
                      {t(item.active ? 'organizations.active' : 'organizations.inactive')}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      to={`/organizations/${item.id}`}
                      aria-label={`${t('organizations.view')}: ${item.razonSocial}`}
                    >
                      {t('organizations.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {result.value.data.length === 0 && <p className={styles.empty}>{t('organizations.empty')}</p>}
          <div className={styles.pagination}>
            <Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              {t('organizations.previous')}
            </Button>
            <span>{t('organizations.page', { page, total: totalPages })}</span>
            <Button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
              {t('organizations.next')}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
