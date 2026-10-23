import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { TextField } from '../../shared/ui/TextField'
import { TextArea } from '../../shared/ui/TextArea'
import { Button } from '../../shared/ui/Button'
import { Notice } from '../../shared/ui/Notice'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { ArrowLeft } from 'lucide-react'
import { Card } from '../../shared/ui/Card'
import { PageHeader } from '../../shared/ui/PageHeader'
import { LinkButton } from '../../shared/ui/LinkButton'

export function NewOrganizationPage() {
  const { t } = useTranslation()
  const { organizations } = useServices()
  const state = useSession()
  const navigate = useNavigate()
  const [fields, setFields] = useState({
    legalName: '',
    rfc: '',
    industrySector: '',
    taxAddress: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  function change(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }))
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const item = await organizations.create({
        legalName: fields.legalName.trim(),
        rfc: fields.rfc.trim().toUpperCase(),
        ...(fields.industrySector.trim() ? { industrySector: fields.industrySector.trim() } : {}),
        ...(fields.taxAddress.trim() ? { taxAddress: fields.taxAddress.trim() } : {}),
      })
      await navigate(`/organizations/${item.id}`, { replace: true, state: { created: true } })
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }
  if (state.status !== 'authenticated') return null
  if (state.session.context.accessMode !== 'PLATFORM_SUPERADMIN') return <Navigate to="/organizations" replace />
  return (
    <section className="grid max-w-3xl gap-6">
      <Link to="/organizations" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold no-underline hover:underline"><ArrowLeft size={16} aria-hidden="true" />{t('app.back')}</Link>
      <PageHeader title={t('organizations.new')} description={t('organizations.createHint')} />
      <Card>
        <form onSubmit={submit} aria-label={t('organizations.new')} aria-busy={busy}>
          <fieldset disabled={busy}>
            <TextField
              label={t('organizations.legalName')}
              value={fields.legalName}
              onChange={(event) => change('legalName', event.target.value)}
              required
              maxLength={255}
              autoComplete="organization"
            />
            <TextField
              label={t('organizations.taxId')}
              value={fields.rfc}
              onChange={(event) => change('rfc', event.target.value.toUpperCase())}
              required
              minLength={12}
              maxLength={13}
              pattern="[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}"
            />
            <TextField
              label={`${t('organizations.sector')} (${t('organizations.optional')})`}
              value={fields.industrySector}
              onChange={(event) => change('industrySector', event.target.value)}
              maxLength={150}
            />
            <TextArea
              label={`${t('organizations.address')} (${t('organizations.optional')})`}
              id="fiscal-address"
              value={fields.taxAddress}
              onChange={(event) => change('taxAddress', event.target.value)}
              maxLength={4000}
              rows={3}
              autoComplete="street-address"
            />
            <Notice>{t('organizations.createLimit')}</Notice>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-0 border-t border-solid border-line pt-6">
              <Button type="submit" loading={busy}>{busy ? t('organizations.saving') : t('organizations.save')}</Button>
              <LinkButton variant="ghost" to="/organizations">{t('app.cancel')}</LinkButton>
            </div>
          </fieldset>
        </form>
        {error !== undefined && <ErrorNotice error={error} />}
      </Card>
    </section>
  )
}
