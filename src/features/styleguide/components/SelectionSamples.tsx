import { useTranslation } from 'react-i18next'
import { Card } from '../../../shared/ui/Card'
import { Checkbox, Radio } from '../../../shared/ui/Checkbox'
import { Switch } from '../../../shared/ui/Switch'

export function SelectionSamples() {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <fieldset className="grid gap-2">
          <legend className="mb-5 font-heading text-base font-semibold text-ink">{t('styleguide.checkboxes')}</legend>
          <Checkbox label="Lorem ipsum" defaultChecked />
          <Checkbox label="Dolor sit amet" />
          <Checkbox label={t('styleguide.disabled')} disabled />
          <Checkbox label={t('styleguide.selectedDisabled')} disabled defaultChecked />
        </fieldset>
      </Card>
      <Card>
        <fieldset className="grid gap-2">
          <legend className="mb-5 font-heading text-base font-semibold text-ink">{t('styleguide.radios')}</legend>
          <Radio label="Lorem ipsum" name="guide-radio" value="lorem" defaultChecked />
          <Radio label="Dolor sit amet" name="guide-radio" value="dolor" />
          <Radio label={t('styleguide.disabled')} name="guide-radio" value="disabled" disabled />
        </fieldset>
      </Card>
      <Card>
        <fieldset className="grid gap-2">
          <legend className="mb-5 font-heading text-base font-semibold text-ink">{t('styleguide.switches')}</legend>
          <Switch label="Lorem ipsum" defaultChecked />
          <Switch label="Dolor sit amet" />
          <Switch label={t('styleguide.disabled')} disabled />
          <Switch label={t('styleguide.selectedDisabled')} disabled defaultChecked />
        </fieldset>
      </Card>
    </div>
  )
}
