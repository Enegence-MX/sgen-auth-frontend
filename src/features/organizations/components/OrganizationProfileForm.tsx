import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '../../../app/services/services-context'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { TextArea } from '../../../shared/ui/TextArea'
import { TextField } from '../../../shared/ui/TextField'
import { ORGANIZATION_LIMITS, type Organization, type OrganizationChanges } from '../model/organization'

interface OrganizationProfileFormProps {
  organization: Organization
  canEditLegalName: boolean
  onSaved: (organization: Organization) => void
  onCancel: () => void
  onError: (error: unknown) => void
}

export function OrganizationProfileForm({ organization, canEditLegalName, onSaved, onCancel, onError }: Readonly<OrganizationProfileFormProps>) {
  const { t } = useTranslation()
  const { organizations } = useServices()
  const [legalName, setLegalName] = useState(organization.legalName)
  const [industrySector, setIndustrySector] = useState(organization.industrySector ?? '')
  const [taxAddress, setTaxAddress] = useState(organization.taxAddress ?? '')
  const [taxAddressError, setTaxAddressError] = useState(false)
  const [busy, setBusy] = useState(false)

  function changes(): OrganizationChanges | undefined {
    const result: OrganizationChanges = {}
    if (canEditLegalName && legalName.trim() !== organization.legalName) result.legalName = legalName.trim()
    const sector = industrySector.trim() || null
    if (sector !== organization.industrySector) result.industrySector = sector
    const address = taxAddress.trim()
    if (!address && organization.taxAddress !== null) return undefined
    if (address && address !== organization.taxAddress) result.taxAddress = address
    return result
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const changed = changes()
    setTaxAddressError(changed === undefined)
    if (!changed) return
    if (!Object.keys(changed).length) {
      onCancel()
      return
    }
    setBusy(true)
    onError(undefined)
    try {
      onSaved(await organizations.update(organization.id, changed))
    } catch (failure) {
      onError(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <form onSubmit={submit} aria-label={t('organizations.editTitle')} aria-busy={busy}>
        <fieldset disabled={busy}>
          {canEditLegalName && (
            <TextField
              label={t('organizations.legalName')}
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              required
              maxLength={ORGANIZATION_LIMITS.legalName}
              autoComplete="organization"
            />
          )}
          <TextField label={t('organizations.taxId')} value={organization.rfc} readOnly />
          <TextField
            label={`${t('organizations.sector')} (${t('organizations.optional')})`}
            value={industrySector}
            onChange={(event) => setIndustrySector(event.target.value)}
            maxLength={ORGANIZATION_LIMITS.industrySector}
          />
          {industrySector && (
            <Button variant="ghost" onClick={() => setIndustrySector('')} className="mb-4">{t('organizations.clearSector')}</Button>
          )}
          <TextArea
            label={t('organizations.address')}
            id="profile-tax-address"
            value={taxAddress}
            onChange={(event) => {
              setTaxAddress(event.target.value)
              setTaxAddressError(false)
            }}
            maxLength={ORGANIZATION_LIMITS.taxAddress}
            rows={3}
            autoComplete="street-address"
            error={taxAddressError ? t('organizations.taxAddressRequired') : undefined}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3 border-0 border-t border-solid border-line pt-6">
            <Button type="submit" loading={busy}>{busy ? t('organizations.savingChanges') : t('organizations.saveChanges')}</Button>
            <Button variant="ghost" onClick={onCancel}>{t('app.cancel')}</Button>
          </div>
        </fieldset>
      </form>
    </Card>
  )
}
