import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { render } from './render'
import { alpha, beta, fixture, platform, tenantSession } from './fixtures'

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Correo electrónico'), 'test@example.test')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.type(await screen.findByLabelText('Contraseña'), crypto.randomUUID())
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('current backend flows', () => {
  it('requires a session for protected routes and removes public registration', async () => {
    const setup = fixture()
    const { router } = render(setup.services, '/organizations/new')
    await screen.findByRole('form', { name: 'Iniciar sesión' })
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByRole('link', { name: 'Registrarse' })).not.toBeInTheDocument()
    await act(async () => {
      await router.navigate('/register')
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
  it('logs platform in, creates an organization and shows its detail', async () => {
    const user = userEvent.setup()
    const setup = fixture()
    render(setup.services)
    await signIn(user)
    await screen.findByText('Development Alpha')
    await user.click(screen.getByRole('link', { name: 'Nueva organización' }))
    await user.type(screen.getByLabelText('Razón social'), 'Live Test Organization')
    await user.type(screen.getByLabelText('RFC maestro'), 'CCC010101CC1')
    await user.click(screen.getByRole('button', { name: 'Crear organización' }))
    await screen.findByRole('heading', { name: 'Live Test Organization' })
    expect(screen.getByRole('status')).toHaveTextContent('Organización creada correctamente.')
    expect(setup.rows).toHaveLength(3)
    expect(sessionStorage).toHaveLength(0)
    expect(localStorage).toHaveLength(0)
  })
  it('shows duplicate RFC error while retaining entered fields', async () => {
    const user = userEvent.setup()
    render(fixture({ initial: platform }).services, '/organizations/new')
    await user.type(await screen.findByLabelText('Razón social'), 'Duplicate Organization')
    await user.type(screen.getByLabelText('RFC maestro'), 'AAA010101AA1')
    await user.click(screen.getByRole('button', { name: 'Crear organización' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una organización con este RFC.',
    )
    expect(screen.getByLabelText('Razón social')).toHaveValue('Duplicate Organization')
  })
  it('requires tenant selection before showing a shared identity session', async () => {
    const user = userEvent.setup()
    const setup = fixture({ shared: true })
    const { router } = render(setup.services)
    await signIn(user)
    await screen.findByRole('heading', { name: 'Elige una organización' })
    expect(router.state.location.pathname).toBe('/login')
    await user.selectOptions(screen.getByLabelText('Organización'), beta)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: 'Development Beta' })
    expect(screen.queryByRole('link', { name: 'Nueva organización' })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/organizations/${beta}`)
  })
  it('restores a tenant session and respects denied cross-tenant detail', async () => {
    const { router } = render(fixture({ initial: tenantSession() }).services, '/organizations')
    await screen.findByRole('heading', { name: 'Development Alpha' })
    expect(router.state.location.pathname).toBe(`/organizations/${alpha}`)
    await act(async () => {
      await router.navigate('/organizations/new')
    })
    await waitFor(() => expect(router.state.location.pathname).toBe(`/organizations/${alpha}`))
    await act(async () => {
      await router.navigate(`/organizations/${beta}`)
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Organización no encontrada')
  })
  it('loads and saves security policies and keeps unavailable console tables empty', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: tenantSession() })
    render(setup.services, '/security')
    expect(await screen.findByRole('heading', { name: 'Consola de seguridad' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Longitud mínima')).toHaveValue(15)
    expect(screen.queryByLabelText('Histórico sin reúso')).not.toBeInTheDocument()
    expect(screen.getByText('Código por correo')).toBeInTheDocument()
    expect(screen.getByText(/Aplicación autenticadora/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /HÍBRIDO/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /FEDERADO/ }))
    expect(screen.getByRole('button', { name: /FEDERADO/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('switch', { name: 'Permitir opt-out con deslinde' }))
    await user.click(screen.getByRole('radio', { name: /CONFIAR EN EL IdP/ }))
    expect(screen.queryByText(/SMS/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Exigir MFA' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'La política de seguridad se guardó correctamente.',
    )
    expect(setup.fetcher).toHaveBeenCalledWith(
      expect.stringContaining(`/organizations/${alpha}/security-policy`),
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(setup.policies.get(alpha)?.mfaRequired).toBe(false)
    const policyUpdate = setup.fetcher.mock.calls.find(
      ([url, init]) =>
        String(url).includes(`/organizations/${alpha}/security-policy`) && init?.method === 'PATCH',
    )
    expect(policyUpdate).toBeDefined()
    const savedPolicy = JSON.parse(String(policyUpdate?.[1]?.body)) as Record<string, unknown>
    expect(savedPolicy).not.toHaveProperty('authMode')
    expect(savedPolicy).not.toHaveProperty('federatedMfaMode')
    expect(savedPolicy).not.toHaveProperty('mfaAllowOptOut')
    expect(savedPolicy).not.toHaveProperty('passwordHistoryCount')

    await user.click(screen.getByRole('tab', { name: /Mapeo de grupos/ }))
    expect(await screen.findByRole('table', { name: 'Mapeo de grupos' })).toBeInTheDocument()
    expect(screen.queryByText('Mapeo de demostración agregado.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Proveedores de identidad/ }))
    expect(
      await screen.findByRole('table', { name: 'Proveedores de identidad' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Dominios verificados' })).toBeInTheDocument()
    expect(screen.queryByText(/demo-industrial/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Usuarios y roles/ }))
    expect(await screen.findByRole('heading', { name: 'Usuarios y roles' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Usuarios y roles' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Bitácora de auditoría' }))
    expect(await screen.findByText('Tu rol no tiene permiso para consultar la auditoría.')).toBeInTheDocument()
  }, 15000)
  it('sends an invitation with backend roles to the active organization', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: tenantSession() })
    render(setup.services, '/security')
    await user.click(await screen.findByRole('tab', { name: /Usuarios y roles/ }))
    await user.type(screen.getByLabelText('Correo electrónico'), 'new.member@example.test')
    const auditorRole = screen.getByRole('checkbox', {
      name: /Auditor interno|Internal auditor/,
    })
    await user.click(auditorRole)
    expect(auditorRole).toBeChecked()
    expect(screen.getByRole('button', { name: 'Enviar invitación' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))
    await waitFor(() =>
      expect(setup.fetcher).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${alpha}/invitations`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'new.member@example.test',
            roles: ['INTERNAL_AUDITOR'],
          }),
        }),
      ),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Invitación enviada a new.member@example.test con estos roles: INTERNAL_AUDITOR.',
    )
  })
  it('accepts an invitation for a new account and records the MFA waiver choice', async () => {
    const user = userEvent.setup()
    const setup = fixture()
    render(setup.services, '/invitations/test_invitation_token_123456')
    expect(await screen.findByRole('list', { name: 'Progreso de activación' })).toBeInTheDocument()
    expect(screen.getByText('Política de la organización')).toBeInTheDocument()
    expect(screen.getByText('Sin caducidad periódica')).toBeInTheDocument()
    expect(screen.queryByText('Histórico sin reúso')).not.toBeInTheDocument()
    await user.type(await screen.findByLabelText('Nombre completo'), 'New Member')
    await user.type(screen.getByLabelText('Crea una contraseña'), 'a-long-test-password')
    await user.type(screen.getByLabelText('Confirma la contraseña'), 'a-long-test-password')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(
      await screen.findByRole('heading', { name: 'Verificación en dos pasos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', {
        name: /Aplicación autenticadora|Authenticator app/,
      }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Volver a la contraseña' }))
    expect(await screen.findByLabelText('Nombre completo')).toHaveValue('New Member')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(
      await screen.findByRole('radio', {
        name: /opción disponible.*omitir MFA|available option to waive MFA/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Aceptaste la invitación.')
    expect(setup.fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/invitations/accept'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"mfa":"WAIVE"'),
      }),
    )
  })
  it('renders invitation details when the API omits newer policy fields', async () => {
    const setup = fixture({
      invitation: {
        passwordExpiryDays: undefined,
        mfaAllowedMethods: undefined,
        authMode: undefined,
      },
    })
    render(setup.services, '/invitations/test_invitation_token_123456')
    expect(await screen.findByText('Política de la organización')).toBeInTheDocument()
    expect(screen.getByText('mariana.torres@energia-bajio.test')).toBeInTheDocument()
  })
  it('enables optional MFA without requesting a second activation code', async () => {
    const user = userEvent.setup()
    const setup = fixture()
    render(setup.services, '/invitations/test_invitation_token_123456')
    await user.type(await screen.findByLabelText('Nombre completo'), 'Gabriel Navarro')
    await user.type(screen.getByLabelText('Crea una contraseña'), 'a-long-test-password')
    await user.type(screen.getByLabelText('Confirma la contraseña'), 'a-long-test-password')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Activar verificación y aceptar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Aceptaste la invitación.')
    expect(setup.fetcher.mock.calls.some(([url]) => String(url).endsWith('/invitations/mfa/start'))).toBe(false)
    const acceptCall = setup.fetcher.mock.calls.find(([url]) =>
      String(url).endsWith('/invitations/accept'),
    )
    expect(JSON.parse(String(acceptCall?.[1]?.body))).toMatchObject({
      token: 'test_invitation_token_123456',
      mfa: 'ENABLE',
    })
  })
  it('creates a new account while enforcing the organization’s required MFA policy', async () => {
    const user = userEvent.setup()
    const setup = fixture({
      invitation: {
        mfaRequired: true,
        mfaWaiver: null,
      },
    })
    render(setup.services, '/invitations/test_invitation_token_123456')
    await user.type(await screen.findByLabelText('Nombre completo'), 'Mariana Torres')
    await user.type(screen.getByLabelText('Crea una contraseña'), 'a-long-test-password')
    await user.type(screen.getByLabelText('Confirma la contraseña'), 'a-long-test-password')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(
      await screen.findByRole('heading', { name: 'Verificación en dos pasos' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar verificación y aceptar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Aceptaste la invitación.')
    expect(setup.fetcher.mock.calls.some(([url]) => String(url).endsWith('/invitations/mfa/start'))).toBe(false)
    const acceptCall = setup.fetcher.mock.calls.find(([url]) =>
      String(url).endsWith('/invitations/accept'),
    )
    expect(acceptCall).toBeDefined()
    expect(JSON.parse(String(acceptCall?.[1]?.body))).toEqual({
      token: 'test_invitation_token_123456',
      fullName: 'Mariana Torres',
      password: 'a-long-test-password',
    })
  })
  it('accepts an invitation for an existing account without asking for a new password', async () => {
    const user = userEvent.setup()
    const setup = fixture({
      invitation: {
        hasAccount: true,
        hasMfa: true,
        mfaRequired: true,
        mfaWaiver: null,
      },
    })
    render(setup.services, '/invitations/test_invitation_token_123456')
    expect(await screen.findByText(/Este correo ya tiene una cuenta/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar verificación y aceptar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Aceptaste la invitación.')
    const acceptCall = setup.fetcher.mock.calls.find(([url]) =>
      String(url).endsWith('/invitations/accept'),
    )
    expect(acceptCall).toBeDefined()
    expect(JSON.parse(String(acceptCall?.[1]?.body))).toEqual({
      token: 'test_invitation_token_123456',
    })
  })
  it('completes the email MFA challenge issued by the backend during sign-in', async () => {
    const user = userEvent.setup()
    const setup = fixture({ mfaLogin: true })
    render(setup.services)
    await user.type(await screen.findByLabelText('Correo electrónico'), 'platform@example.test')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.type(await screen.findByLabelText('Contraseña'), 'test-password')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await user.type(await screen.findByLabelText('Código de verificación'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    expect(await screen.findByText('Development Alpha')).toBeInTheDocument()
    expect(setup.fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/auth/mfa/verify'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          challengeToken: 'test_mfa_challenge_token_123456',
          code: '123456',
        }),
      }),
    )
  })
  it('lets platform admins select an organization and opens the support dialog', async () => {
    const user = userEvent.setup()
    render(fixture({ initial: platform }).services, '/security')
    expect(await screen.findByRole('heading', { name: 'Consola de seguridad' })).toBeInTheDocument()
    await user.selectOptions(await screen.findByLabelText('Organización'), alpha)
    expect(await screen.findByLabelText('Longitud mínima')).toHaveValue(15)
    expect(screen.getByLabelText('Longitud mínima')).toBeDisabled()
    expect(screen.getByText(/puedes consultar la política/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Contexto de soporte' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Contexto de soporte' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
  it('opens the empty support-context structure without fictitious grants', async () => {
    const user = userEvent.setup()
    render(fixture({ initial: tenantSession() }).services, '/security')
    await user.click(await screen.findByRole('button', { name: /Contexto de soporte/ }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Contexto de soporte' })).toBeInTheDocument()
    expect(screen.queryByText('Industrias Demo, S.A. de C.V.')).not.toBeInTheDocument()
  })
  it.each([
    'INVALID_CREDENTIALS',
    'MFA_REQUIRED',
    'FEDERATED_LOGIN_REQUIRED',
    'PASSWORD_CHANGE_REQUIRED',
  ])('does not authenticate when backend returns %s', async (code) => {
    const user = userEvent.setup()
    const { router } = render(fixture({ loginError: code }).services)
    await signIn(user)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
  })
  it('renews and closes the current session', async () => {
    const user = userEvent.setup()
    render(fixture({ initial: platform }).services, '/session')
    await user.click(await screen.findByRole('button', { name: 'Renovar sesión' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Sesión renovada correctamente.')
    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }))
    await screen.findByRole('form', { name: 'Iniciar sesión' })
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('')
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
  })
  it('searches organizations and changes visible language', async () => {
    const user = userEvent.setup()
    render(fixture({ initial: platform }).services, '/organizations')
    await screen.findByText('Development Beta')
    await user.type(screen.getByRole('textbox', { name: 'Buscar por nombre o RFC' }), 'Beta')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(screen.queryByText('Development Alpha')).not.toBeInTheDocument())
    await screen.findByText('Development Beta')
    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Mi sesión' }))
    await user.selectOptions(await screen.findByLabelText('Idioma'), 'en')
    await user.click(await screen.findByRole('link', { name: 'Organizations' }))
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument()
    expect(document.title).toBe('SGEn | Organizations')
  })
})
