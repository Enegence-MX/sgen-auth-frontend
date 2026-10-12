import { useTranslation } from 'react-i18next'
import { ApiError } from '../api/errors'
import { translateError } from '../i18n/translate-error'
import { Notice } from './Notice'
export function ErrorNotice({ error }: Readonly<{ error: unknown }>) {
  const { t } = useTranslation()
  return (
    <Notice variant="error" role="alert">
      <p>{translateError(error, t)}</p>
      {error instanceof ApiError && error.requestId && (
        <small>{t('app.reference', { id: error.requestId })}</small>
      )}
    </Notice>
  )
}
