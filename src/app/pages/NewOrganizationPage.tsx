import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { TextField } from '../../shared/ui/TextField'
import { TextArea } from '../../shared/ui/TextArea'
import { Button } from '../../shared/ui/Button'
import { Notice } from '../../shared/ui/Notice'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import styles from './Workspace.module.css'

export function NewOrganizationPage() {
  const { t } = useTranslation()
  const { organizations } = useServices()
  const state = useSession()
  const navigate = useNavigate()
  const [fields, setFields] = useState({
    razonSocial: '',
    rfcMaestro: '',
    sectorIndustrial: '',
    domicilioFiscal: '',
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
        razonSocial: fields.razonSocial.trim(),
        rfcMaestro: fields.rfcMaestro.trim().toUpperCase(),
        ...(fields.sectorIndustrial.trim() ? { sectorIndustrial: fields.sectorIndustrial.trim() } : {}),
        ...(fields.domicilioFiscal.trim() ? { domicilioFiscal: fields.domicilioFiscal.trim() } : {}),
      })
      await navigate(`/organizations/${item.id}`, { replace: true, state: { created: true } })
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }
  if (state.status !== 'authenticated') return null
  if (state.session.context.mod !== 'SUPERADMIN_PLATAFORMA') return <Navigate to="/organizations" replace />
  return (
    <section className={styles.formPanel}>
      <Link to="/organizations">{t('app.back')}</Link>
      <h1>{t('organizations.new')}</h1>
      <p>{t('organizations.createHint')}</p>
      <form onSubmit={submit} aria-label={t('organizations.new')} aria-busy={busy}>
        <fieldset disabled={busy}>
          <TextField
            label={t('organizations.legalName')}
            value={fields.razonSocial}
            onChange={(event) => change('razonSocial', event.target.value)}
            required
            maxLength={255}
            autoComplete="organization"
          />
          <TextField
            label={t('organizations.taxId')}
            value={fields.rfcMaestro}
            onChange={(event) => change('rfcMaestro', event.target.value.toUpperCase())}
            required
            minLength={12}
            maxLength={13}
            pattern="[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}"
          />
          <TextField
            label={`${t('organizations.sector')} (${t('organizations.optional')})`}
            value={fields.sectorIndustrial}
            onChange={(event) => change('sectorIndustrial', event.target.value)}
            maxLength={150}
          />
          <TextArea
            label={`${t('organizations.address')} (${t('organizations.optional')})`}
            id="fiscal-address"
            value={fields.domicilioFiscal}
            onChange={(event) => change('domicilioFiscal', event.target.value)}
            maxLength={4000}
            rows={3}
            autoComplete="street-address"
          />
          <Notice>{t('organizations.createLimit')}</Notice>
          <div className={styles.formActions}>
            <Button type="submit">{busy ? t('organizations.saving') : t('organizations.save')}</Button>
            <Link to="/organizations">{t('app.cancel')}</Link>
          </div>
        </fieldset>
      </form>
      {error !== undefined && <ErrorNotice error={error} />}
    </section>
  )
}
