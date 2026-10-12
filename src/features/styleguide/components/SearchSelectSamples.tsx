import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../shared/ui/Card'
import { SearchSelect } from '../../../shared/ui/SearchSelect'

const options = [
  { value: 'lorem', label: 'Lorem ipsum' },
  { value: 'dolor', label: 'Dolor sit amet' },
  { value: 'consectetur', label: 'Consectetur adipiscing' },
  { value: 'sed', label: 'Sed do eiusmod' },
  { value: 'tempor', label: 'Tempor incididunt' },
  { value: 'labore', label: 'Labore et dolore' },
  { value: 'magna', label: 'Magna aliqua', disabled: true },
  { value: 'enim', label: 'Ut enim ad minim' },
]

export function SearchSelectSamples() {
  const { t } = useTranslation()
  const [value, setValue] = useState<string | null>(null)
  const [values, setValues] = useState<string[]>(['lorem', 'dolor'])
  const labels = {
    placeholder: t('styleguide.searchOptions'),
    empty: t('styleguide.noResults'),
    toggle: t('styleguide.toggleOptions'),
    clear: t('styleguide.clearSelection'),
    selected: t('styleguide.selectedOptions'),
    remove: (label: string) => t('styleguide.removeOption', { label }),
  }
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.singleSelect')}</h3>
        <SearchSelect label={t('styleguide.category')} options={options} labels={labels} value={value} onValueChange={setValue} />
        <div className="mt-6"><SearchSelect label={t('styleguide.disabledField')} options={options} labels={labels} value="lorem" onValueChange={setValue} disabled /></div>
      </Card>
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.multipleSelect')}</h3>
        <SearchSelect label={t('styleguide.categories')} options={options} labels={labels} multiple value={values} onValueChange={setValues} />
      </Card>
    </div>
  )
}
