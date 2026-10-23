import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { ApiError, responseError, validationMessages } from '../src/shared/api/errors'
import { createI18n } from '../src/shared/i18n/create-i18n'
import { errorTranslationKey, translateError } from '../src/shared/i18n/translate-error'
import { ErrorNotice } from '../src/shared/ui/ErrorNotice'
import { errorCodes } from './support/contract-validator'

const genericCodes = new Set(['METHOD_NOT_ALLOWED', 'INTERNAL_ERROR', 'INVALID_DATABASE_ROLE'])
const requestId = '7a1f2c4e-1b9d-4c3a-8f00-5b2a9c7e6d11'

function showError(error: unknown) {
  render(
    <I18nextProvider i18n={createI18n(['es'])}>
      <ErrorNotice error={error} />
    </I18nextProvider>,
  )
}

describe('error catalog', () => {
  it('reads the 42 codes of the contract', () => {
    expect(errorCodes).toHaveLength(42)
  })
  it.each(errorCodes.filter((code) => !genericCodes.has(code)))('has a specific translation for %s', (code) => {
    expect(errorTranslationKey(code)).not.toBe('unknown')
  })
  it('drops codes that are not in the contract', () => {
    expect(errorTranslationKey('MFA_REQUIRED')).toBe('unknown')
    expect(errorTranslationKey('REQUEST_FAILED')).toBe('unknown')
  })
})

describe('error envelope', () => {
  it('keeps message, details and requestId from the response', () => {
    const error = responseError(400, {
      error: { code: 'VALIDATION_FAILED', message: 'Datos inválidos.', details: ['legalName es obligatorio.'] },
      requestId,
    })
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', serverMessage: 'Datos inválidos.', requestId })
    expect(validationMessages(error)).toEqual(['legalName es obligatorio.'])
  })
  it('falls back to the server message only for a code outside the contract', () => {
    const { t } = createI18n(['es'])
    expect(translateError(new ApiError(409, 'FUTURE_CODE', undefined, requestId, 'Texto del servidor.'), t)).toBe(
      'Texto del servidor.',
    )
    expect(translateError(new ApiError(401, 'INVALID_CREDENTIALS', undefined, requestId, 'Otro texto.'), t)).toBe(
      'Credenciales inválidas o acceso no disponible.',
    )
  })
  it('shows the request reference for server errors only', () => {
    showError(new ApiError(500, 'INTERNAL_ERROR', undefined, requestId))
    expect(screen.getByRole('alert')).toHaveTextContent(`Referencia: ${requestId}`)
  })
  it('hides the request reference for client errors and lists validation details', () => {
    showError(new ApiError(400, 'VALIDATION_FAILED', ['rfc no es válido.'], requestId))
    expect(screen.getByRole('alert')).not.toHaveTextContent('Referencia')
    expect(screen.getByText('rfc no es válido.')).toBeInTheDocument()
  })
})
