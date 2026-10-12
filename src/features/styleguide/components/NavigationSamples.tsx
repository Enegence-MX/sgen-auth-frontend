import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Copy, Ellipsis, FilePenLine, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Badge } from '../../../shared/ui/Badge'
import { Tabs } from '../../../shared/ui/Tabs'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from '../../../shared/ui/DropdownMenu'
import { useToasts } from '../../../shared/ui/use-toasts'

export function TabSamples() {
  const { t } = useTranslation()
  const items = ['Lorem ipsum', 'Dolor sit'].map((label, index) => ({ value: String(index), label, content: <div className="min-h-32 rounded-control bg-subtle p-5"><h4 className="mt-0 mb-3 font-heading text-base text-ink">{label}</h4><p className="m-0 text-sm leading-relaxed">{t('styleguide.bodySample')}</p></div> }))
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{(['underline', 'segmented'] as const).map((variant) => <Card key={variant}><h3 className="mt-0 mb-6 font-heading text-base text-ink">{t(variant === 'underline' ? 'styleguide.underlineTabs' : 'styleguide.segmentedTabs')}</h3><Tabs label={t(variant === 'underline' ? 'styleguide.underlineTabs' : 'styleguide.segmentedTabs')} variant={variant} items={[...items, { value: 'disabled', label: t('styleguide.disabled'), content: null, disabled: true }]} /></Card>)}</div>
}

export function DropdownSamples() {
  const { t } = useTranslation()
  const toasts = useToasts()
  const [selected, setSelected] = useState(['recordName', 'category'])
  const columns = ['recordName', 'category', 'status'] as const
  const action = (title: string) => toasts.add({ title, description: t('styleguide.fieldHint'), type: 'info' })
  const actions = <><DropdownMenuGroup label={t('styleguide.actions')}><DropdownMenuItem icon={<FilePenLine size={17} />} onClick={() => action(t('styleguide.edit'))}>{t('styleguide.edit')}</DropdownMenuItem><DropdownMenuItem icon={<Copy size={17} />} onClick={() => action(t('styleguide.duplicate'))}>{t('styleguide.duplicate')}</DropdownMenuItem><DropdownMenuItem disabled>{t('styleguide.disabled')}</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem destructive icon={<Trash2 size={17} />} onClick={() => action(t('styleguide.delete'))}>{t('styleguide.delete')}</DropdownMenuItem></>
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.actions')}</h3>
        <div className="flex flex-wrap items-center gap-3"><DropdownMenu trigger={<Button variant="secondary">{t('styleguide.actions')}<ChevronDown size={17} aria-hidden="true" /></Button>}>{actions}</DropdownMenu><DropdownMenu trigger={<Button size="icon" variant="ghost" aria-label={t('styleguide.moreActions')}><Ellipsis size={20} aria-hidden="true" /></Button>} align="end">{actions}</DropdownMenu></div>
      </Card>
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.menuOptions')}</h3>
        <DropdownMenu trigger={<Button variant="secondary"><SlidersHorizontal size={17} aria-hidden="true" />{t('styleguide.columns')}<ChevronDown size={17} aria-hidden="true" /></Button>}>
          <DropdownMenuGroup label={t('styleguide.columns')}>{columns.map((column) => <DropdownMenuCheckboxItem key={column} checked={selected.includes(column)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, column] : current.filter((value) => value !== column))}>{t(`styleguide.${column}`)}</DropdownMenuCheckboxItem>)}</DropdownMenuGroup>
        </DropdownMenu>
        <div className="mt-5 flex min-h-7 flex-wrap gap-2">{columns.filter((column) => selected.includes(column)).map((column) => <Badge key={column} variant="brand">{t(`styleguide.${column}`)}</Badge>)}</div>
      </Card>
    </div>
  )
}
