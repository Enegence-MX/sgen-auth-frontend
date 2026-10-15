import { SelectField } from './SelectField'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../../app/services/services-context'

export function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const { auth } = useServices()
  const state = useSession()

  return (
    <SelectField label={t('app.language')} className="mb-0!"
      value={i18n.resolvedLanguage ?? 'es'}
      onChange={(event) => {
        const lang = event.target.value
        void i18n.changeLanguage(lang)
        if (state.status === 'authenticated') {
          void auth.updateSettings({ language: lang })
        }
      }}

    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </SelectField>
  )
}
