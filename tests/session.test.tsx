import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { normalizeSession, type Session } from '../src/features/auth/model/session'
import { contractViolations, fixture, platform, tenantSession } from './fixtures'
import { render } from './render'

const reservedMode = (): Session => ({
  ...tenantSession(),
  context: { accessMode: 'DELEGATED_SUPPORT' as Session['context']['accessMode'], organization: null },
})

describe('session access modes', () => {
  it('treats an unknown access mode as NO_CONTEXT without organization or permissions', () => {
    expect(normalizeSession(reservedMode())).toMatchObject({
      context: { accessMode: 'NO_CONTEXT', organization: null },
      permissions: [],
    })
    expect(normalizeSession(tenantSession())).toEqual(tenantSession())
  })
  it('shows only the no-context notice and sign-out for a reserved access mode', async () => {
    const user = userEvent.setup()
    const { router } = render(fixture({ initial: reservedMode() }).services, '/security')
    expect(await screen.findByText(/Tu cuenta no tiene una organización activa/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Organizaci/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Consola de seguridad' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    // The reserved mode is not in the contract yet; the fixture sends it on purpose.
    expect(contractViolations.splice(0).every((violation) => violation.includes('accessMode'))).toBe(true)
  })
})

describe('identity preferences', () => {
  it('uses browser defaults while language and theme are null and applies them after saving', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    render(setup.services, '/session')
    const language = await screen.findByLabelText('Idioma')
    expect(document.documentElement).not.toHaveClass('dark')
    await user.selectOptions(language, 'en')
    expect(await screen.findByRole('heading', { name: 'My session' })).toBeInTheDocument()
    const me = setup.services.auth.getSnapshot()
    expect(me.session?.identity.language).toBe('en')
  })
})

describe('password state banner', () => {
  it('warns when the password expires soon', async () => {
    render(
      fixture({
        initial: {
          ...tenantSession(),
          password: { ...platform.password, expiresSoon: true, daysRemaining: 3, expiresAt: '2026-10-26T12:00:00.000Z' },
        },
      }).services,
      '/session',
    )
    expect(await screen.findByText('Tu contraseña vence en 3 días. Actualízala para conservar el acceso.')).toBeInTheDocument()
  })
  it('does not warn when expiresSoon has no days remaining', async () => {
    render(
      fixture({ initial: { ...tenantSession(), password: { ...platform.password, expiresSoon: true } } }).services,
      '/session',
    )
    await screen.findByRole('heading', { name: 'Mi sesión' })
    expect(screen.queryByText(/Tu contraseña vence/)).not.toBeInTheDocument()
  })
})
