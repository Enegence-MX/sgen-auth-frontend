import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '../../../app/services/services-context'
import { hasCode } from '../../../shared/api/errors'
import { Button } from '../../../shared/ui/Button'
import { ErrorNotice } from '../../../shared/ui/ErrorNotice'
import { Modal } from '../../../shared/ui/Modal'
import { Notice } from '../../../shared/ui/Notice'
import { TextArea } from '../../../shared/ui/TextArea'
import { ORGANIZATION_LIMITS, type Organization } from '../model/organization'

interface OrganizationStatusDialogProps {
  organization: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: (organization: Organization) => void
  onConflict: (error: unknown) => void
}

export function OrganizationStatusDialog({ organization, open, onOpenChange, onChanged, onConflict }: Readonly<OrganizationStatusDialogProps>) {
  const { t } = useTranslation()
  const { organizations } = useServices()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const suspending = organization.active
  const title = t(suspending ? 'organizations.suspendTitle' : 'organizations.reactivateTitle')

  function close(next: boolean) {
    if (!next) {
      setReason('')
      setError(undefined)
    }
    onOpenChange(next)
  }

  async function confirm() {
    setBusy(true)
    setError(undefined)
    try {
      onChanged(await organizations.changeStatus(organization.id, !suspending, reason.trim()))
      close(false)
    } catch (failure) {
      if (hasCode(failure, 'CONFLICT')) {
        close(false)
        onConflict(failure)
      } else {
        setError(failure)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={title}
      closeLabel={t('app.cancel')}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>{t('app.cancel')}</Button>
          <Button loading={busy} disabled={!reason.trim()} onClick={() => { void confirm() }}>
            {title}
          </Button>
        </>
      }
    >
      {suspending && <Notice variant="warning" className="mb-4">{t('organizations.suspendWarning')}</Notice>}
      <TextArea
        label={t('organizations.reason')}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={ORGANIZATION_LIMITS.reason}
        rows={3}
        required
        hint={`${reason.length} / ${ORGANIZATION_LIMITS.reason}`}
      />
      {error !== undefined && <ErrorNotice error={error} />}
    </Modal>
  )
}
