import { useTranslation } from 'react-i18next'
import type { AuditEvent } from '../api/audit-api'
import { AuditData, AuditReference } from './audit-display'
import { auditLabel } from '../model/audit-label'

export function AuditEventDetail({ event }: Readonly<{ event: AuditEvent }>) {
  const { t, i18n } = useTranslation()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }).format(new Date(event.createdAt))
  const entityType = auditLabel(t, 'entities', event.entityType, 'unknownEntity')
  const fields = {
    date: <span>{date} UTC</span>,
    actor: <AuditReference name={event.actorName || t(event.actorId ? 'audit.unavailable' : 'audit.anonymous')} reference={event.actorId} />,
    action: <AuditReference name={auditLabel(t, 'actions', event.action, 'unknownAction')} reference={event.action} />,
    scope: <AuditReference name={auditLabel(t, 'values', event.scope)} reference={event.scope} />,
    result: <AuditReference name={auditLabel(t, 'values', event.result)} reference={event.result} />,
    entity: <AuditReference name={`${entityType} · ${event.entityName || t('audit.unavailable')}`} reference={event.entityId} />,
    tenant: <AuditReference name={event.tenantName || t(event.tenantId ? 'audit.unavailable' : 'audit.none')} reference={event.tenantId} />,
    group: <AuditReference name={event.groupName || t(event.groupId ? 'audit.unavailable' : 'audit.none')} reference={event.groupId} />,
    reason: <AuditData value={event.reason} />,
    request: <AuditReference name={t(event.requestId ? 'audit.requestLabel' : 'audit.none')} reference={event.requestId} />,
  }
  return <div className="grid min-w-0 gap-5 text-sm">
    <dl className="m-0 grid gap-4 sm:grid-cols-2">{Object.entries(fields).map(([key, value]) => <div key={key} className={['entity', 'tenant', 'reason', 'request'].includes(key) ? 'sm:col-span-2' : ''}>
      <dt className="mb-1 font-semibold text-ink">{t(`audit.${key}` as 'audit.date')}</dt><dd className="m-0 whitespace-pre-wrap">{value}</dd>
    </div>)}</dl>
    {(['before', 'after'] as const).map((key) => <section key={key} aria-label={t(`audit.${key}`)}>
      <h3 className="mt-0 text-sm font-semibold text-ink">{t(`audit.${key}`)}</h3>
      <div className="rounded-control bg-subtle p-3"><AuditData value={event[key]} /></div>
    </section>)}
  </div>
}
