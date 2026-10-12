import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { fixture, platform } from './fixtures'
import { render } from './render'

it('keeps the organization payload and navigation when using shared fields', async () => {
  const user = userEvent.setup()
  const setup = fixture({ initial: platform })
  const create = vi.spyOn(setup.services.organizations, 'create')
  const { router } = render(setup.services, '/organizations/new')
  await user.type(await screen.findByLabelText('Razón social'), '  Sample Organization  ')
  await user.type(screen.getByLabelText('RFC maestro'), 'CCC010101CC1')
  await user.type(screen.getByLabelText(/Domicilio fiscal/), '  Lorem ipsum  ')
  await user.click(screen.getByRole('button', { name: 'Crear organización' }))
  await screen.findByRole('heading', { name: 'Sample Organization' })
  expect(create).toHaveBeenCalledWith({ razonSocial: 'Sample Organization', rfcMaestro: 'CCC010101CC1', domicilioFiscal: 'Lorem ipsum' })
  expect(router.state.location.pathname).toMatch(/^\/organizations\/[^/]+$/)
})
