import { useCallback, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../../../app/services/services-context'
import { useResource } from '../../../app/hooks/use-resource'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { SelectField } from '../../../shared/ui/SelectField'
import { Table } from '../../../shared/ui/Table'
import { Pagination } from '../../../shared/ui/Pagination'
import { Modal } from '../../../shared/ui/Modal'
import { Notice } from '../../../shared/ui/Notice'
import { ErrorNotice } from '../../../shared/ui/ErrorNotice'
import { Spinner } from '../../../shared/ui/Loading'
import { Badge } from '../../../shared/ui/Badge'
import { AuditEventDetail } from './AuditEventDetail'
import { AuditReference } from './audit-display'
import { auditLabel } from '../model/audit-label'
import type { AuditEvent, AuditFilters } from '../api/audit-api'

export function AuditPanel({ tenantId }: Readonly<{ tenantId?: string }>) {
  const session = useSession()
  const { t } = useTranslation()
  if (session.status !== 'authenticated') return null
  const allowed = session.session.context.accessMode === 'PLATFORM_SUPERADMIN'
    || session.session.permissions.some((permission) => permission.code === 'VIEW_SECURITY_AUDIT')
  if (!allowed) return <Notice>{t('audit.denied')}</Notice>
  return <AuditResults key={tenantId ?? 'current'} tenantId={tenantId} />
}
function AuditResults({ tenantId }: Readonly<{ tenantId?: string }>) {
  const { audit } = useServices()
  const { t } = useTranslation()
  const [draft, setDraft] = useState<AuditFilters>({})
  const [filters, setFilters] = useState<AuditFilters>({})
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditEvent | null>(null)
  const load = useCallback((signal: AbortSignal) => audit.list(page, { ...filters, tenantId }, signal), [audit, page, filters, tenantId])
  const loadCatalog = useCallback((signal: AbortSignal) => audit.catalog(signal), [audit])
  const events = useResource(load)
  const catalog = useResource(loadCatalog)
  const pages = Math.ceil((events.value?.meta.total ?? 0) / 25)
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSelected(null)
    setFilters({ ...draft, from: draft.from ? `${draft.from}:00Z` : undefined, to: draft.to ? `${draft.to}:59.999Z` : undefined })
  }
  const change = (field: keyof AuditFilters, value: string) => setDraft((current) => ({ ...current, [field]: value }))
  return <div className="grid min-w-0 gap-5">
    <div><h2 className="m-0 font-heading text-xl font-semibold text-ink">{t('audit.title')}</h2><p className="mb-0 text-sm">{t('audit.description')}</p></div>
    <Card>
      <form onSubmit={submit} aria-label={t('audit.filters')} className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><TextField label={t('audit.from')} type="datetime-local" value={draft.from ?? ''} onChange={(event) => change('from', event.target.value)} /></div>
        <div><TextField label={t('audit.to')} type="datetime-local" min={draft.from} value={draft.to ?? ''} onChange={(event) => change('to', event.target.value)} /></div>
        <div><TextField label={t('audit.actorFilter')} value={draft.actor ?? ''} maxLength={255} onChange={(event) => change('actor', event.target.value)} /></div>
        <div><SelectField label={t('audit.action')} value={draft.action ?? ''} onChange={(event) => change('action', event.target.value)}><option value="">{t('audit.all')}</option>{catalog.value?.map(({ action }) => <option key={action} value={action}>{auditLabel(t, 'actions', action, 'unknownAction')}</option>)}</SelectField></div>
        <div><SelectField label={t('audit.scope')} value={draft.scope ?? ''} onChange={(event) => change('scope', event.target.value)}><option value="">{t('audit.all')}</option><option value="PLATFORM">{t('audit.platform')}</option><option value="TENANT">{t('audit.tenantScope')}</option><option value="CORPORATE">{t('audit.corporate')}</option></SelectField></div>
        <div><SelectField label={t('audit.result')} value={draft.result ?? ''} onChange={(event) => change('result', event.target.value)}><option value="">{t('audit.all')}</option><option value="SUCCESS">{t('audit.success')}</option><option value="FAILURE">{t('audit.failure')}</option><option value="DENIED">{t('audit.deniedResult')}</option></SelectField></div>
        <div><Button type="submit" disabled={events.loading}>{t('audit.apply')}</Button></div>
      </form>
    </Card>
    {catalog.error !== undefined && <ErrorNotice error={catalog.error} />}
    {events.loading && <Spinner label={t('app.loading')} />}
    {events.error !== undefined && <><ErrorNotice error={events.error} /><Button variant="secondary" onClick={events.retry}>{t('app.retry')}</Button></>}
    {events.value && <>
      <Table id="audit-events" caption={t('audit.total', { count: events.value.meta.total })}>
        <thead><tr>{(['date', 'actor', 'action', 'scope', 'result', 'detail'] as const).map((key) => <th key={key} scope="col">{t(`audit.${key}`)}</th>)}</tr></thead>
        <tbody>{events.value.data.map((event) => <tr key={event.id}>
          <td><time className="whitespace-nowrap" dateTime={event.createdAt}>{new Date(event.createdAt).toISOString().slice(0, 10)}<small className="mt-1 block text-xs text-body">{new Date(event.createdAt).toISOString().slice(11, 19)} UTC</small></time></td>
          <td className="min-w-44"><AuditReference name={event.actorName || t(event.actorId ? 'audit.unavailable' : 'audit.anonymous')} reference={event.actorId} /></td>
          <td className="min-w-44"><AuditReference name={auditLabel(t, 'actions', event.action, 'unknownAction')} reference={event.action} /></td>
          <td><AuditReference name={auditLabel(t, 'values', event.scope)} reference={event.scope} /></td>
          <td><Badge variant={resultVariant(event.result)}>{auditLabel(t, 'values', event.result)}</Badge><small className="mt-1 block font-mono text-[11px] text-body">{event.result}</small></td>
          <td><Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => setSelected(event)}>{t('audit.viewDetail')}</Button></td>
        </tr>)}</tbody>
      </Table>
      {events.value.data.length === 0 && <Notice>{t('audit.empty')}</Notice>}
      <Pagination page={page} pageCount={pages} onPageChange={(value) => { setSelected(null); setPage(value) }} controls="audit-events" labels={{ navigation: t('audit.title'), previous: t('audit.previous'), next: t('audit.next'), page: (value) => t('audit.page', { page: value, total: pages }), status: (value, total) => t('audit.page', { page: value, total }) }} />
    </>}
    <Modal open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }} title={t('audit.detail')} closeLabel={t('audit.close')}>
      {selected && <AuditEventDetail event={selected} />}
    </Modal>
  </div>
}
function resultVariant(result: string) {
  if (result === 'SUCCESS') return 'success'
  if (result === 'DENIED') return 'warning'
  if (result === 'FAILURE') return 'error'
  return 'neutral'
}
