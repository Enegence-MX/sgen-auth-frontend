import { useTranslation } from 'react-i18next'
import { ApiError, validationMessages } from '../api/errors'
import { translateError } from '../i18n/translate-error'
import { Notice } from './Notice'
export function ErrorNotice({ error }: Readonly<{ error: unknown }>) {
  const { t } = useTranslation()
  const details = validationMessages(error)
  return (
    <Notice variant="error" role="alert">
      <p>{translateError(error, t)}</p>
      {details.length > 0 && (
        <ul>
          {details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      )}
      {error instanceof ApiError && error.status >= 500 && error.requestId && (
        <small>{t('app.reference', { id: error.requestId })}</small>
      )}
    </Notice>
  )
}
