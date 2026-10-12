import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, CircleAlert, Info, Plus, TriangleAlert } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { Notice } from '../../../shared/ui/Notice'
import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'
import { SelectField } from '../../../shared/ui/SelectField'
import { Checkbox } from '../../../shared/ui/Checkbox'

export function ButtonSamples() {
  const { t } = useTranslation()
  const [selection, setSelection] = useState('')
  return (
    <Card>
      <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.buttons')}</h3>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setSelection(t('styleguide.primaryAction'))}><Plus size={17} aria-hidden="true" />{t('styleguide.primaryAction')}</Button>
        <Button variant="secondary" onClick={() => setSelection(t('styleguide.secondaryAction'))}>{t('styleguide.secondaryAction')}</Button>
        <Button variant="ghost" onClick={() => setSelection(t('styleguide.ghostAction'))}>{t('styleguide.ghostAction')}<ArrowRight size={16} aria-hidden="true" /></Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-0 border-t border-solid border-line pt-6">
        <Button size="sm" onClick={() => setSelection(t('styleguide.small'))}>{t('styleguide.small')}</Button>
        <Button disabled>{t('styleguide.disabled')}</Button>
        <Button loading>{t('styleguide.loading')}</Button>
      </div>
      <p role="status" className="mt-4 mb-0 min-h-5 text-sm text-body">{selection && `${t('styleguide.selected')}: ${selection}`}</p>
    </Card>
  )
}

export function FeedbackSamples() {
  const { t } = useTranslation()
  return (
    <Card>
      <h3 className="m-0 mb-5 font-heading text-base text-ink">{t('styleguide.indicators')}</h3>
      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="success"><Check size={13} aria-hidden="true" />{t('styleguide.active')}</Badge>
        <Badge variant="warning">{t('styleguide.review')}</Badge>
        <Badge variant="error">{t('styleguide.error')}</Badge>
        <Badge>{t('styleguide.draft')}</Badge>
        <Badge variant="brand">{t('styleguide.selected')}</Badge>
      </div>
      <h3 className="m-0 mb-4 font-heading text-base text-ink">{t('styleguide.notices')}</h3>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Notice className="flex items-start gap-3"><Info size={18} className="shrink-0" aria-hidden="true" />{t('styleguide.neutralNotice')}</Notice>
        <Notice variant="success" className="flex items-start gap-3"><Check size={18} className="shrink-0" aria-hidden="true" />{t('styleguide.successNotice')}</Notice>
        <Notice variant="warning" className="flex items-start gap-3"><TriangleAlert size={18} className="shrink-0" aria-hidden="true" />{t('styleguide.warningNotice')}</Notice>
        <Notice variant="error" className="flex items-start gap-3"><CircleAlert size={18} className="shrink-0" aria-hidden="true" />{t('styleguide.warningNotice')}</Notice>
      </div>
    </Card>
  )
}

export function ExampleForm() {
  const { t } = useTranslation()
  const [savedName, setSavedName] = useState('')

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('organizationName')
    if (typeof name === 'string') setSavedName(name.trim())
  }

  return (
    <Card>
      <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.formTitle')}</h3>
      <form aria-label={t('styleguide.formTitle')} onSubmit={submit} onReset={() => setSavedName('')}>
        <TextField label={t('styleguide.name')} name="organizationName" placeholder={t('styleguide.namePlaceholder')} required maxLength={120} />
        <SelectField label={t('styleguide.role')} id="guide-access" name="access">
          <option value="reader">{t('styleguide.reader')}</option>
          <option value="editor">{t('styleguide.editor')}</option>
        </SelectField>
        <Checkbox name="updates" label={t('styleguide.updates')} />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" size="sm"><Check size={16} aria-hidden="true" />{t('styleguide.save')}</Button>
          <Button type="reset" size="sm" variant="ghost">{t('styleguide.reset')}</Button>
        </div>
        {savedName && <Notice variant="success" role="status" className="mt-4 text-sm">{t('styleguide.saved', { name: savedName })}</Notice>}
      </form>
    </Card>
  )
}
