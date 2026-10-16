import { useTranslation } from 'react-i18next'
import { auditLabel } from '../model/audit-label'

export function AuditReference({ name, reference }: Readonly<{ name: string; reference?: string | null }>) {
  return <span className="block min-w-0">
    <span className="block break-words text-ink">{name}</span>
    {reference && reference !== name && <small className="mt-1 block break-all font-mono text-[11px] leading-relaxed text-body">{reference}</small>}
  </span>
}

export function AuditData({ value }: Readonly<{ value: unknown }>) {
  const { t } = useTranslation()
  if (value === null || value === undefined) return <span>{t('audit.none')}</span>
  if (Array.isArray(value)) return <ul className="m-0 grid gap-2 pl-4">{value.map((item, index) => <li key={index}><AuditData value={item} /></li>)}</ul>
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span>{t('audit.none')}</span>
    return <dl className="m-0 grid gap-3">{entries.map(([key, item]) => <div key={key}>
      <dt className="font-semibold"><AuditReference name={auditLabel(t, 'fields', key, 'unknownField')} reference={key} /></dt>
      <dd className="m-0 mt-1"><AuditData value={item} /></dd>
    </div>)}</dl>
  }
  if (typeof value === 'boolean') return <span>{t(value ? 'audit.yes' : 'audit.no')}</span>
  if (typeof value === 'number') return <span>{value}</span>
  const text = String(value)
  const translated = t(`audit.values.${text}` as 'audit.values.SUCCESS', { defaultValue: '' })
  if (translated) return <AuditReference name={translated} reference={text} />
  if (/^[A-Z][A-Z0-9_]*$/.test(text) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(text))
    return <AuditReference name={t('audit.unknownValue')} reference={text} />
  return <span className="break-words">{text}</span>
}
