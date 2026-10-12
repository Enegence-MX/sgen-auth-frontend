import { Fragment, useId, useRef, useState } from 'react'
import { icons, Search, SearchX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeGuideSearch } from '../guide-sections'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Pagination } from '../../../shared/ui/Pagination'

const PAGE_SIZE = 24

function normalizeIconSearch(value: string) {
  return normalizeGuideSearch(value).replaceAll(/[\s_-]/g, '')
}

// The library namespace contains the canonical icons, without duplicate aliases.
const catalog = Object.entries(icons)
  .map(([name, Icon]) => ({ name, Icon, search: normalizeIconSearch(name) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

export default function IconCatalog() {
  const { t } = useTranslation()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const normalizedQuery = normalizeIconSearch(query)
  const filtered = catalog.filter((icon) => icon.search.includes(normalizedQuery))
  const start = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function clearQuery() {
    updateQuery('')
    input.current?.focus()
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Badge variant="brand">Lucide</Badge>
        <span className="text-xs tabular-nums text-body">{t('styleguide.iconCount', { count: catalog.length })}</span>
      </div>
      <label htmlFor={id} className="sr-only">{t('styleguide.searchIcons')}</label>
      <div className="flex min-h-12 items-center gap-3 rounded-control border border-solid border-line bg-field px-3 shadow-control focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/12 forced-colors:focus-within:outline-2">
        <Search size={19} aria-hidden="true" className="shrink-0 text-muted" />
        <input ref={input} id={id} type="search" value={query} onChange={(event) => updateQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); clearQuery() }
        }} placeholder={t('styleguide.searchIcons')} autoComplete="off" spellCheck={false} className="min-w-0 flex-1 border-0 bg-transparent py-3 font-sans text-base text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
        {query && <Button size="icon" variant="ghost" aria-label={t('styleguide.clearIconSearch')} onClick={clearQuery}><X size={17} aria-hidden="true" /></Button>}
      </div>
      <p role="status" aria-atomic="true" className="my-5 text-xs tabular-nums text-body">{t('styleguide.rowRange', { start: filtered.length ? start + 1 : 0, end: Math.min(start + PAGE_SIZE, filtered.length), total: filtered.length })}</p>
      <ul id={`${id}-results`} aria-label={t('styleguide.iconCatalog')} className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {visible.map(({ name, Icon }) => <li key={name} className="group flex min-h-28 min-w-0 flex-col items-center justify-center gap-4 rounded-control border border-solid border-line-soft bg-subtle/40 p-3 text-center transition-colors hover:border-brand/30 hover:bg-brand-soft motion-reduce:transition-none">
          <Icon size={28} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-ink group-hover:text-brand" />
          <span className="max-w-full font-mono text-xs leading-relaxed break-words text-body [overflow-wrap:anywhere] group-hover:text-brand">{name.split(/(?=[A-Z])/).map((word, index) => <Fragment key={index}>{index > 0 && <wbr />}{word}</Fragment>)}</span>
        </li>)}
      </ul>
      {filtered.length === 0 && <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-control border border-dashed border-line text-muted"><SearchX size={32} aria-hidden="true" /><p className="m-0 text-sm font-semibold text-ink">{t('styleguide.noIcons')}</p><Button variant="secondary" size="sm" onClick={clearQuery}>{t('styleguide.showAllIcons')}</Button></div>}
      {filtered.length > PAGE_SIZE && <div className="mt-6 border-0 border-t border-solid border-line pt-5"><Pagination page={page} pageCount={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} controls={`${id}-results`} labels={{
        navigation: t('styleguide.iconPagination'),
        previous: t('styleguide.previousPage'),
        next: t('styleguide.nextPage'),
        page: (value) => t('styleguide.pageNumber', { page: value }),
        status: (value, count) => t('styleguide.pageStatus', { page: value, pages: count }),
      }} /></div>}
    </Card>
  )
}
