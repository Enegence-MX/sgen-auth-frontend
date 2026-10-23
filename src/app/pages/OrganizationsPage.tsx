import { useCallback, useState, type SubmitEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { isPlatform, isTenant } from '../../features/auth/model/session'
import { useResource } from '../hooks/use-resource'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { Table } from '../../shared/ui/Table'
import { Badge } from '../../shared/ui/Badge'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Plus, Search } from 'lucide-react'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'
import { LinkButton } from '../../shared/ui/LinkButton'
import { Pagination } from '../../shared/ui/Pagination'
import { Spinner } from '../../shared/ui/Loading'

export function OrganizationsPage() {
  const state = useSession()
  if (state.status !== 'authenticated') return null
  if (isPlatform(state.session)) return <PlatformOrganizations />
  if (isTenant(state.session) && state.session.context.organization)
    return <Navigate to={`/organizations/${state.session.context.organization.id}`} replace />
  return null
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
  const totalPages = Math.max(1, Math.ceil((result.value?.meta.total ?? 0) / (result.value?.meta.pageSize ?? 10)))
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(query.trim())
  }
  return (
    <section className="grid min-w-0 gap-6">
      <PageHeader title={t('organizations.title')} description={t('organizations.description')} actions={
        <LinkButton to="/organizations/new"><Plus size={18} aria-hidden="true" />{t('organizations.new')}</LinkButton>
      } />
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={submit} aria-label={t('organizations.search')}>
          <div className="min-w-0 flex-1 basis-64">
            <TextField label={t('organizations.search')} placeholder={t('organizations.search')} value={query} maxLength={255} className="mb-0!" onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Button type="submit" variant="secondary" disabled={result.loading} className="min-h-12"><Search size={18} aria-hidden="true" />{t('organizations.searchButton')}</Button>
        </form>
      </Card>
      {result.loading && <Spinner label={t('app.loading')} />}
      {result.error !== undefined && (
        <>
          <ErrorNotice error={result.error} />
          <Button onClick={result.retry}>{t('app.retry')}</Button>
        </>
      )}
      {result.value && (
        <>
          <Table id="organizations-table" caption={t('organizations.total', { count: result.value.meta.total })}>
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
                  <td className="max-w-[450px] font-semibold text-ink [overflow-wrap:anywhere]">{item.legalName}</td>
                  <td>{item.rfc}</td>
                  <td>
                    <Badge variant={item.active ? 'success' : 'warning'}>
                      {t(item.active ? 'organizations.active' : 'organizations.inactive')}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      to={`/organizations/${item.id}`}
                      aria-label={`${t('organizations.view')}: ${item.legalName}`}
                    >
                      {t('organizations.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {result.value.data.length === 0 && <p className="m-0 rounded-card border border-dashed border-line bg-panel px-5 py-10 text-center text-sm text-body">{t('organizations.empty')}</p>}
          <Pagination page={page} pageCount={totalPages} onPageChange={setPage} variant="compact" controls="organizations-table" labels={{
            navigation: t('organizations.title'), previous: t('organizations.previous'), next: t('organizations.next'),
            page: (value) => t('organizations.page', { page: value, total: totalPages }),
            status: (value, total) => t('organizations.page', { page: value, total }),
          }} />
        </>
      )}
    </section>
  )
}
