import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Table } from '../../../shared/ui/Table'
import { Badge } from '../../../shared/ui/Badge'
import { Checkbox } from '../../../shared/ui/Checkbox'

const rows = [
  { id: '01', name: 'Lorem ipsum', category: 'Dolor sit amet', status: 'active', variant: 'success' },
  { id: '02', name: 'Dolor sit amet', category: 'Consectetur adipiscing', status: 'review', variant: 'warning' },
  { id: '03', name: 'Consectetur adipiscing', category: 'Lorem ipsum', status: 'draft', variant: 'neutral' },
  { id: '04', name: 'Sed do eiusmod', category: 'Dolor sit amet', status: 'active', variant: 'success' },
] as const

export function TableSamples() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<readonly string[]>([])
  function select(id: string, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id))
  }
  return (
    <div className="grid gap-4">
      <Table caption={t('styleguide.records')}>
        <thead><tr><th scope="col"><span className="sr-only">{t('styleguide.selection')}</span></th><th scope="col">{t('styleguide.recordName')}</th><th scope="col">{t('styleguide.category')}</th><th scope="col">{t('styleguide.status')}</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} data-selected={selected.includes(row.id)}>
            <td className="w-16"><Checkbox hideLabel label={t('styleguide.selectRow', { name: row.name })} checked={selected.includes(row.id)} onChange={(event) => select(row.id, event.target.checked)} /></td>
            <td className="font-semibold text-ink">{row.name}</td><td>{row.category}</td><td><Badge variant={row.variant}>{t(`styleguide.${row.status}`)}</Badge></td>
          </tr>
        ))}</tbody>
      </Table>
      <Table caption={t('styleguide.emptyState')}>
        <thead><tr><th scope="col">{t('styleguide.recordName')}</th><th scope="col">{t('styleguide.category')}</th><th scope="col">{t('styleguide.status')}</th></tr></thead>
        <tbody><tr><td colSpan={3}><p className="my-6 text-center">Lorem ipsum dolor sit amet.</p></td></tr></tbody>
      </Table>
    </div>
  )
}
