import { useId, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CircleAlert, Info, PanelTop } from 'lucide-react'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Tooltip } from '../../../shared/ui/Tooltip'
import { Modal } from '../../../shared/ui/Modal'
import { TextField } from '../../../shared/ui/TextField'
import { useToasts } from '../../../shared/ui/use-toasts'

export function TooltipSamples() {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Tooltip content="Lorem ipsum dolor sit amet."><Button variant="secondary">{t('styleguide.top')}</Button></Tooltip>
      <Tooltip content="Lorem ipsum dolor sit amet." side="right"><Button variant="secondary">{t('styleguide.right')}</Button></Tooltip>
      <Tooltip content="Lorem ipsum dolor sit amet." side="bottom"><Button variant="secondary">{t('styleguide.bottom')}</Button></Tooltip>
      <Tooltip content="Lorem ipsum dolor sit amet."><Button size="icon" variant="ghost" aria-label={t('styleguide.information')}><Info size={19} aria-hidden="true" /></Button></Tooltip>
    </Card>
  )
}

export function ModalSamples() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const formId = useId()
  const toasts = useToasts()
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormOpen(false)
    toasts.add({ title: t('styleguide.success'), description: 'Lorem ipsum dolor sit amet.', type: 'success' })
  }
  return (
    <Card className="flex flex-wrap gap-3">
      <Modal trigger={<Button><PanelTop size={18} aria-hidden="true" />{t('styleguide.openModal')}</Button>} title="Lorem ipsum" description={t('styleguide.fieldHint')} closeLabel={t('styleguide.close')} open={open} onOpenChange={setOpen} footer={<Button onClick={() => setOpen(false)}>{t('styleguide.accept')}</Button>}>
        <p className="m-0 text-sm leading-relaxed">{t('styleguide.bodySample')}</p>
      </Modal>
      <Modal trigger={<Button variant="secondary">{t('styleguide.formModal')}</Button>} title={t('styleguide.formTitle')} description={t('styleguide.fieldHint')} closeLabel={t('styleguide.close')} open={formOpen} onOpenChange={setFormOpen} footer={<><Button variant="secondary" onClick={() => setFormOpen(false)}>{t('styleguide.cancel')}</Button><Button type="submit" form={formId}>{t('styleguide.save')}</Button></>}>
        <form id={formId} onSubmit={submit}>
          <TextField label={t('styleguide.name')} name="name" placeholder="Lorem ipsum" required />
          <TextField label={t('styleguide.email')} name="email" type="email" placeholder="lorem@ipsum.test" />
        </form>
      </Modal>
    </Card>
  )
}

export function ToastSamples() {
  const { t } = useTranslation()
  const toasts = useToasts()
  return (
    <Card className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => toasts.add({ title: t('styleguide.information'), description: 'Lorem ipsum dolor sit amet.', type: 'info' })}><Info size={18} aria-hidden="true" />{t('styleguide.information')}</Button>
      <Button variant="secondary" onClick={() => toasts.add({ title: t('styleguide.success'), description: 'Lorem ipsum dolor sit amet.', type: 'success' })}><Check size={18} aria-hidden="true" />{t('styleguide.success')}</Button>
      <Button variant="secondary" onClick={() => toasts.add({ title: t('styleguide.error'), description: 'Lorem ipsum dolor sit amet.', type: 'error', priority: 'high' })}><CircleAlert size={18} aria-hidden="true" />{t('styleguide.error')}</Button>
    </Card>
  )
}
