import { SelectField } from './SelectField'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../../app/services/services-context'

export function ThemeSelector() {
  const { t } = useTranslation()
  const { auth } = useServices()
  const state = useSession()

  const currentTheme = state.status === 'authenticated' ? state.session.identity.theme || 'light' : 'light'

  return (
    <SelectField label={t('app.theme')} className="mb-0!"
      value={currentTheme}
      onChange={(event) => {
        const theme = event.target.value
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        if (state.status === 'authenticated') {
          void auth.updateSettings({ theme })
        }
      }}

    >
      <option value="light">{t('app.light')}</option>
      <option value="dark">{t('app.dark')}</option>
    </SelectField>
  )
}
