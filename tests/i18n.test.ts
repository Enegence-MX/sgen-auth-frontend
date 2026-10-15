import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/shared/api/errors'
import { createI18n, resolveLocale, supportedLocales } from '../src/shared/i18n/create-i18n'
import { en } from '../src/shared/i18n/locales/en'
import { es } from '../src/shared/i18n/locales/es'
import { translateError } from '../src/shared/i18n/translate-error'

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]: [string, unknown]) => {
      const path = prefix ? `${prefix}.${key}` : key
      if (typeof entry === 'string') return [[path, entry]]
      if (entry !== null && typeof entry === 'object') return Object.entries(flatten(entry, path))
      throw new Error(`Unexpected catalog value at ${path}`)
    }),
  )
}

describe('language configuration and catalogs', () => {
  it.each([
    { preferences: ['en-US'], expected: 'en' },
    { preferences: ['EN_gb'], expected: 'en' },
    { preferences: ['es-MX'], expected: 'es' },
    { preferences: ['es-ES', 'en'], expected: 'es' },
    { preferences: ['fr-FR', 'en-US', 'es'], expected: 'en' },
    { preferences: ['fr-FR'], expected: 'es' },
    { preferences: [], expected: 'es' },
  ])('resolves $preferences to $expected', ({ preferences, expected }) => {
    expect(resolveLocale(preferences)).toBe(expected)
    const i18n = createI18n(preferences)
    expect(i18n.isInitialized).toBe(true)
    expect(i18n.resolvedLanguage).toBe(expected)
  })

  it('ships only complete English and Spanish catalogs with matching interpolation parameters', () => {
    expect(supportedLocales).toEqual(['en', 'es'])
    const english = flatten(en)
    const spanish = flatten(es)
    const compareStrings = (first: string, second: string) => first.localeCompare(second)
    expect(Object.keys(spanish).sort(compareStrings)).toEqual(Object.keys(english).sort(compareStrings))
    const parameters = (value: string) =>
      [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(([, parameter = '']) => parameter).sort(compareStrings)
    for (const [key, value] of Object.entries(english)) {
      const translation = spanish[key] ?? ''
      expect(translation.trim(), key).not.toBe('')
      expect(parameters(translation), key).toEqual(parameters(value))
      // Copyright text is not an emoji, even though Unicode includes it in this property.
      expect((value + translation).replaceAll('©', ''), key).not.toMatch(/\p{Extended_Pictographic}/u)
    }
    expect(Object.keys(createI18n().options.resources ?? {})).toEqual(['en', 'es'])
  })

  it('falls back to Spanish for unsupported programmatic language changes', async () => {
    const i18n = createI18n(['en'])
    await i18n.changeLanguage('fr')
    expect(i18n.resolvedLanguage).toBe('es')
    expect(i18n.t('auth.loginButton')).toBe('Entrar')
  })
})

describe('localized backend errors', () => {
  it('translates current API codes without leaking internal messages', () => {
    expect(translateError(new ApiError(401, 'INVALID_CREDENTIALS'), createI18n(['es']).t)).toBe(
      'Credenciales inválidas o acceso no disponible.',
    )
    expect(translateError(new ApiError(500, 'INTERNAL_ERROR'), createI18n(['en']).t)).toBe(
      'The operation could not be completed.',
    )
    expect(translateError(new TypeError('fetch'), createI18n(['en']).t)).toBe(
      'Unable to connect to the service. Check your connection.',
    )
  })
})
