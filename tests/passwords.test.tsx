import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PasswordState } from '../src/features/passwords/model/password-policy'
import { fixture, tenantSession } from './fixtures'
import { render } from './render'

const passwordState: PasswordState = {
  policy: {
    minimumLength: 15,
    maximumLength: 128,
    historyCount: 5,
    expiryDays: null,
    lengthUnit: 'UNICODE_CODE_POINTS',
  },
  changeRequired: true,
  expiresAt: null,
  daysRemaining: null,
  expiresSoon: false,
}

function passwordFixture(passwordChangeError?: string) {
  return fixture({
    initial: { ...tenantSession(), password: passwordState },
    passwordChangeError,
  })
}

async function submitPassword(
  user: ReturnType<typeof userEvent.setup>,
  currentValue: string,
  nextValue: string,
  confirmation = nextValue,
) {
  await user.type(await screen.findByLabelText('Contraseña actual'), currentValue)
  await user.type(screen.getByLabelText('Nueva contraseña'), nextValue)
  await user.type(screen.getByLabelText('Confirma la nueva contraseña'), confirmation)
  await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))
}

describe('password change flows', () => {
  it('hides unavailable navigation and settings during a required change while keeping sign-out available', async () => {
    const user = userEvent.setup()
    const session = tenantSession()
    const setup = fixture({ initial: {
      ...session,
      identity: { ...session.identity, name: 'Lucía Navarro', language: 'en', theme: 'dark' },
      password: passwordState,
    } })
    const { router } = render(setup.services, '/session')

    await waitFor(() => expect(router.state.location.pathname).toBe('/password'))
    expect(await screen.findByLabelText('Current password')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /navigation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /User menu/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(setup.fetcher.mock.calls.some(([url]) => String(url).endsWith('/auth/me/settings'))).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(setup.fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/logout'))).toHaveLength(1)
    expect(setup.services.auth.getSnapshot().status).toBe('anonymous')
  })

  it('keeps normal navigation and settings available for an optional password change', async () => {
    const user = userEvent.setup()
    const session = tenantSession()
    const setup = fixture({ initial: {
      ...session,
      identity: { ...session.identity, name: 'Lucía Navarro', language: 'es', theme: 'light' },
      password: { ...passwordState, changeRequired: false },
    } })
    const { router } = render(setup.services, '/password')

    await screen.findByLabelText('Contraseña actual')
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Menú de usuario: Lucía Navarro' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Mi sesión' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/session'))
    expect(await screen.findByLabelText('Tema')).toBeInTheDocument()
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument()
  })

  it('redirects a session requiring a password change to /password', async () => {
    const setup = passwordFixture()
    const { router } = render(setup.services, '/organizations')

    await waitFor(() => expect(router.state.location.pathname).toBe('/password'))
    expect(await screen.findByLabelText('Contraseña actual')).toBeInTheDocument()
    expect(screen.getByText('Sin caducidad periódica')).toBeInTheDocument()
    expect(setup.fetcher.mock.calls.some(([url]) => String(url).includes('/organizations'))).toBe(false)
    expect(setup.services.auth.getSnapshot().status).toBe('authenticated')
  })

  it('sends the exact password values and clears the session after a successful change', async () => {
    const user = userEvent.setup()
    const setup = passwordFixture()
    const { router } = render(setup.services, '/password')
    const currentValue = 'senderos entre pinos y cedros'
    const nextValue = '  brisa sobre los encinos  '

    await submitPassword(user, currentValue, nextValue)

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(await screen.findByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tu contraseña se actualizó y las sesiones anteriores se cerraron. Ingresa con tu nueva contraseña.',
    )
    const calls = setup.fetcher.mock.calls.filter(([url]) => String(url).endsWith('/password/change'))
    expect(calls).toHaveLength(1)
    expect(calls[0]?.[1]).toEqual(expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ currentPassword: currentValue, newPassword: nextValue }),
    }))
    expect(setup.services.auth.getSnapshot()).toEqual({ status: 'anonymous', session: null })
    const changeIndex = setup.fetcher.mock.calls.findIndex(([url]) => String(url).endsWith('/password/change'))
    const afterChange = setup.fetcher.mock.calls.slice(changeIndex + 1).map(([url]) => String(url))
    expect(afterChange.filter((url) => url.endsWith('/auth/me') || url.endsWith('/auth/refresh'))).toEqual([])

    await act(async () => { await router.navigate('/organizations') })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('keeps the session and makes no API call when the confirmation does not match', async () => {
    const user = userEvent.setup()
    const setup = passwordFixture()
    const { router } = render(setup.services, '/password')
    await screen.findByLabelText('Contraseña actual')
    const requestsBeforeSubmit = setup.fetcher.mock.calls.length

    await submitPassword(user, 'senderos entre pinos y cedros', 'brisa sobre los encinos', 'brisa sobre los cedros')

    expect(await screen.findByText('Las contraseñas nuevas no coinciden.')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirma la nueva contraseña')).toHaveAttribute('aria-invalid', 'true')
    expect(setup.fetcher).toHaveBeenCalledTimes(requestsBeforeSubmit)
    expect(router.state.location.pathname).toBe('/password')
    expect(setup.services.auth.getSnapshot().status).toBe('authenticated')
  })

  it('shows PASSWORD_REUSED without signing out or reporting a successful change', async () => {
    const user = userEvent.setup()
    const setup = passwordFixture('PASSWORD_REUSED')
    const { router } = render(setup.services, '/password')
    const nextValue = 'brisa sobre los encinos'

    await submitPassword(user, 'senderos entre pinos y cedros', nextValue)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Elige una contraseña distinta de la actual y de las anteriores.',
    )
    expect(setup.fetcher.mock.calls.filter(([url]) => String(url).endsWith('/password/change'))).toHaveLength(1)
    expect(router.state.location.pathname).toBe('/password')
    expect(setup.services.auth.getSnapshot().status).toBe('authenticated')
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue(nextValue)
    expect(screen.getByRole('button', { name: 'Actualizar contraseña' })).toBeEnabled()
    expect(screen.queryByRole('form', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it.each([
    ['PASSWORD_TOO_SHORT', 'La contraseña debe tener al menos 15 caracteres Unicode.'],
    ['PASSWORD_TOO_LONG', 'La contraseña debe tener como máximo 128 caracteres Unicode.'],
    ['CURRENT_PASSWORD_INVALID', 'La contraseña actual no es correcta.'],
    ['PASSWORD_CHANGE_BLOCKED', 'El cambio está bloqueado temporalmente.'],
    ['PASSWORD_CHECK_UNAVAILABLE', 'No pudimos comprobar tu contraseña en este momento.'],
  ])('shows %s from the backend without signing out', async (code, message) => {
    const user = userEvent.setup()
    const setup = passwordFixture(code)
    render(setup.services, '/password')
    await submitPassword(user, 'senderos entre pinos y cedros', 'brisa sobre los encinos')
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(setup.services.auth.getSnapshot().status).toBe('authenticated')
  })
})

