import { useTranslation } from 'react-i18next'
import { Card } from '../../../shared/ui/Card'
import { TextField } from '../../../shared/ui/TextField'
import { TextArea } from '../../../shared/ui/TextArea'
import { SelectField } from '../../../shared/ui/SelectField'

export function FieldSamples() {
  const { t } = useTranslation()
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.textFields')}</h3>
        <TextField label={t('styleguide.name')} placeholder="Lorem ipsum" hint={t('styleguide.fieldHint')} />
        <TextField label={t('styleguide.email')} type="email" defaultValue="Lorem ipsum" error={t('styleguide.errorSample')} />
        <TextField label={t('styleguide.readOnlyField')} defaultValue="Lorem ipsum dolor sit amet" readOnly />
        <TextField label={t('styleguide.disabledField')} defaultValue="Lorem ipsum" disabled />
      </Card>
      <div className="grid gap-4">
        <Card>
          <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.textAreas')}</h3>
          <TextArea label={t('styleguide.description')} placeholder={t('styleguide.bodySample')} hint={t('styleguide.fieldHint')} />
          <TextArea label={t('styleguide.disabledField')} defaultValue="Lorem ipsum dolor sit amet." rows={2} disabled />
        </Card>
        <Card>
          <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.selects')}</h3>
          <SelectField label={t('styleguide.category')} defaultValue="lorem">
            <option value="lorem">Lorem ipsum</option><option value="dolor">Dolor sit amet</option><option value="consectetur">Consectetur adipiscing</option>
          </SelectField>
          <SelectField label={t('styleguide.disabledField')} disabled><option>Lorem ipsum</option></SelectField>
        </Card>
      </div>
    </div>
  )
}
