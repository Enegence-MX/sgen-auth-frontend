import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Session } from '../src/features/auth/model/session'
import { alpha, fixture, platform, tenantSession } from './fixtures'
import { render } from './render'

const withoutProfilePermission = (): Session => {
  const session = tenantSession()
  return { ...session, permissions: session.permissions.filter(({ code }) => code !== 'MANAGE_ORGANIZATION_PROFILE') }
}

function sentBodies(setup: ReturnType<typeof fixture>, method: string, suffix: string) {
  return setup.fetcher.mock.calls
    .filter(([url, init]) => init?.method === method && String(url).endsWith(suffix))
    .map(([, init]) => JSON.parse(String(init?.body)) as unknown)
}

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Editar' }))
  return screen.findByRole('form', { name: 'Editar organización' })
}

describe('organization profile', () => {
  it('lets the platform change the legal name and sends only that field', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    render(setup.services, `/organizations/${alpha}`)
    const form = await openEditor(user)
    const legalName = within(form).getByLabelText('Razón social')
    await user.clear(legalName)
    await user.type(legalName, 'Alpha Renombrada')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('heading', { name: 'Alpha Renombrada' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Organización actualizada correctamente.')
    expect(sentBodies(setup, 'PATCH', `/organizations/${alpha}`)).toEqual([{ legalName: 'Alpha Renombrada' }])
  })
  it('lets a tenant with the profile permission change the tax address but not the legal name', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: tenantSession() })
    render(setup.services, `/organizations/${alpha}`)
    const form = await openEditor(user)
    expect(within(form).queryByLabelText('Razón social')).not.toBeInTheDocument()
    await user.type(within(form).getByLabelText('Domicilio fiscal'), 'Av. Uno 100')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Av. Uno 100')).toBeInTheDocument()
    expect(sentBodies(setup, 'PATCH', `/organizations/${alpha}`)).toEqual([{ taxAddress: 'Av. Uno 100' }])
  })
  it('hides the edit button for a tenant without the profile permission', async () => {
    render(fixture({ initial: withoutProfilePermission() }).services, `/organizations/${alpha}`)
    await screen.findByRole('heading', { name: 'Development Alpha' })
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })
  it('clears the industry sector with null', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    setup.rows[0]!.industrySector = 'Energía'
    render(setup.services, `/organizations/${alpha}`)
    const form = await openEditor(user)
    await user.click(within(form).getByRole('button', { name: 'Limpiar sector' }))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('status')
    expect(sentBodies(setup, 'PATCH', `/organizations/${alpha}`)).toEqual([{ industrySector: null }])
  })
  it('does not let the tax address become empty', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    setup.rows[0]!.taxAddress = 'Calle 1'
    render(setup.services, `/organizations/${alpha}`)
    const form = await openEditor(user)
    await user.clear(within(form).getByLabelText('Domicilio fiscal'))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(await within(form).findByText('El domicilio fiscal no puede quedar vacío.')).toBeInTheDocument()
    expect(sentBodies(setup, 'PATCH', `/organizations/${alpha}`)).toEqual([])
  })
  it('reloads permissions and closes the editor after PERMISSION_REQUIRED', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: tenantSession() })
    render(setup.services, `/organizations/${alpha}`)
    const form = await openEditor(user)
    await user.type(within(form).getByLabelText('Domicilio fiscal'), 'Av. Dos 200')
    setup.setSession(withoutProfilePermission())
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Editar organización' })).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso para realizar esta acción.')
  })
})

describe('organization status', () => {
  it('suspends with a required reason and then offers reactivation', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    render(setup.services, `/organizations/${alpha}`)
    await user.click(await screen.findByRole('button', { name: 'Suspender' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Se cerrará la sesión de todos los usuarios de esta organización.')
    const confirm = within(dialog).getByRole('button', { name: 'Suspender organización' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Motivo'), 'Falta de pago')
    expect(within(dialog).getByText('13 / 500')).toBeInTheDocument()
    await user.click(confirm)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Suspendida')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reactivar' })).toBeInTheDocument()
    expect(sentBodies(setup, 'POST', `/organizations/${alpha}/suspend`)).toEqual([{ reason: 'Falta de pago' }])
  })
  it('shows the conflict and reloads when the status already changed', async () => {
    const user = userEvent.setup()
    const setup = fixture({ initial: platform })
    render(setup.services, `/organizations/${alpha}`)
    await user.click(await screen.findByRole('button', { name: 'Suspender' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Motivo'), 'Revisión')
    setup.rows[0]!.active = false
    await user.click(within(dialog).getByRole('button', { name: 'Suspender organización' }))
    expect(await screen.findByText(/Los datos cambiaron mientras trabajabas/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Reactivar' })).toBeInTheDocument()
    expect(screen.getByText('Suspendida')).toBeInTheDocument()
  })
  it('does not offer suspension to tenant users', async () => {
    render(fixture({ initial: tenantSession() }).services, `/organizations/${alpha}`)
    await screen.findByRole('heading', { name: 'Development Alpha' })
    expect(screen.queryByRole('button', { name: 'Suspender' })).not.toBeInTheDocument()
  })
})
