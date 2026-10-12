import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'
import { Pagination } from '../../../shared/ui/Pagination'
import { SelectField } from '../../../shared/ui/SelectField'
import { Table } from '../../../shared/ui/Table'

const names = ['Lorem ipsum', 'Dolor sit amet', 'Consectetur adipiscing', 'Sed do eiusmod']
const rows = Array.from({ length: 58 }, (_, index) => ({ id: index + 1, name: names[index % names.length] }))

export function PaginationSamples() {
  const { t } = useTranslation()
  const tableId = useId()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [compactPage, setCompactPage] = useState(3)
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, rows.length)
  const labels = {
    navigation: t('styleguide.numberedPagination'),
    previous: t('styleguide.previousPage'),
    next: t('styleguide.nextPage'),
    page: (value: number) => t('styleguide.pageNumber', { page: value }),
    status: (value: number, count: number) => t('styleguide.pageStatus', { page: value, pages: count }),
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.numberedPagination')}</h3>
        <Table id={tableId} caption={t('styleguide.records')}>
          <thead><tr><th scope="col">ID</th><th scope="col">{t('styleguide.recordName')}</th><th scope="col">{t('styleguide.status')}</th></tr></thead>
          <tbody>{rows.slice(start, end).map((row) => <tr key={row.id}><td className="w-20 font-mono tabular-nums">{String(row.id).padStart(2, '0')}</td><td className="font-semibold text-ink">{row.name}</td><td><Badge variant="success">{t('styleguide.active')}</Badge></td></tr>)}</tbody>
        </Table>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <p className="m-0 py-3 text-sm tabular-nums">{t('styleguide.rowRange', { start: start + 1, end, total: rows.length })}</p>
          <div className="w-40"><SelectField label={t('styleguide.rowsPerPage')} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="mb-0">{[5, 10, 20].map((size) => <option key={size} value={size}>{size}</option>)}</SelectField></div>
        </div>
        <div className="mt-5 border-0 border-t border-solid border-line pt-5"><Pagination page={page} pageCount={Math.ceil(rows.length / pageSize)} onPageChange={setPage} controls={tableId} labels={labels} /></div>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.compactPagination')}</h3>
          <Pagination variant="compact" page={compactPage} pageCount={12} onPageChange={setCompactPage} labels={{ ...labels, navigation: t('styleguide.compactPagination') }} />
        </Card>
        <Card>
          <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.disabled')}</h3>
          <Pagination variant="compact" page={1} pageCount={12} onPageChange={setCompactPage} disabled labels={{ ...labels, navigation: t('styleguide.disabledPagination') }} />
        </Card>
      </div>
    </div>
  )
}
