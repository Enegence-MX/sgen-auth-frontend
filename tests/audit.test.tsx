import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './render'
import { fixture, organization, platform, tenantSession } from './fixtures'
import type { AuditEvent } from '../src/features/audit/api/audit-api'

const tenantId = 'c670858e-4754-4d6c-9d12-31f94503a8f7'
const legalName = 'Servicios Energéticos del Bajío, S.A. de C.V.'
const event: AuditEvent = {
  id: 'b07a8321-d083-4ade-a73e-c8fc74cde2f9', actorId: 'f83d57ea-9db7-4623-8c55-6283c9a9d657',
  actorName: 'Mariana Torres Méndez', tenantName: legalName, groupName: null, entityName: legalName,
  scope: 'TENANT', tenantId, groupId: null, action: 'UPDATE_SECURITY_POLICY', module: 'ORGANIZATIONS',
  entityType: 'tenant_security_policies', entityId: tenantId, createdAt: '2026-10-16T15:42:18.673Z', result: 'SUCCESS',
  reason: null, requestId: '8bc7f4a6-6e92-439b-8df2-1d05c72f9a34', before: { mfaRequired: false }, after: { mfaRequired: true },
}
function setup(allowed = true, rows = [event], language = 'es') {
  const session = tenantSession(tenantId)
  session.identity = { ...session.identity, id: event.actorId!, email: 'mariana.torres@energia-bajio.test', name: 'Mariana Torres Méndez' }
  session.context.organization = { id: tenantId, legalName }
  if (allowed) session.permissions.push({ module: 'SECURITY', code: 'VIEW_SECURITY_AUDIT' })
  const result = fixture({ initial: session })
  const policy = result.policies.values().next().value!
  result.rows.splice(0, result.rows.length, organization(tenantId, legalName, 'SEB180614K72'))
  result.policies.clear()
  result.policies.set(tenantId, { ...policy, organizationId: tenantId })
  const list = vi.spyOn(result.services.audit, 'list').mockResolvedValue({ data: rows, meta: { page: 1, pageSize: 25, total: rows.length ? 26 : 0 } })
  vi.spyOn(result.services.audit, 'catalog').mockResolvedValue([{ action: event.action, module: event.module, reasonRequired: false }])
  render(result.services, '/security', [language])
  return { ...result, list }
}
async function openAudit() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('tab', { name: 'Bitácora de auditoría' }))
  return user
}
describe('audit query view', () => {
  it('allows platform audit access without a tenant permission', async () => {
    const result = fixture({ initial: platform })
    const list = vi.spyOn(result.services.audit, 'list').mockResolvedValue({
      data: [event], meta: { page: 1, pageSize: 25, total: 1 },
    })
    vi.spyOn(result.services.audit, 'catalog').mockResolvedValue([])
    render(result.services, '/security')
    await openAudit()
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith(1, { tenantId: undefined }, expect.any(AbortSignal))
    expect(screen.queryByText('Tu rol no tiene permiso para consultar la auditoría.')).not.toBeInTheDocument()
  })
  it('loads permitted events, applies UTC filters, paginates and shows safe details', async () => {
    const result = setup()
    const user = await openAudit()
    expect(await screen.findByRole('table', { name: '26 eventos' })).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText(event.actorName!)).toBeInTheDocument()
    expect(within(table).getByText(event.actorId!).tagName).toBe('SMALL')
    expect(within(table).getByText('Cambio de política de seguridad')).toBeInTheDocument()
    expect(within(table).getByText('Éxito')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Desde (UTC)'), { target: { value: '2026-10-01T00:00' } })
    fireEvent.change(screen.getByLabelText('Hasta (UTC)'), { target: { value: '2026-10-16T23:59' } })
    await user.type(screen.getByLabelText('Persona (nombre o ID)'), 'Mariana Torres')
    await user.selectOptions(screen.getByLabelText('Acción'), event.action)
    await user.selectOptions(screen.getByLabelText('Ámbito'), 'TENANT')
    await user.selectOptions(screen.getByLabelText('Resultado'), 'SUCCESS')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(result.list).toHaveBeenLastCalledWith(1, expect.objectContaining({ from: '2026-10-01T00:00:00Z', to: '2026-10-16T23:59:59.999Z', actor: 'Mariana Torres', action: event.action, scope: 'TENANT', result: 'SUCCESS' }), expect.any(AbortSignal)))
    await user.click(await screen.findByRole('button', { name: 'Página siguiente' }))
    await waitFor(() => expect(result.list).toHaveBeenLastCalledWith(2, expect.any(Object), expect.any(AbortSignal)))
    await user.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    const detail = await screen.findByRole('dialog')
    expect(within(detail).getByText(event.requestId!)).toBeInTheDocument()
    expect(within(detail).getByText(event.actorName!)).toBeInTheDocument()
    expect(within(detail).getByText(legalName)).toBeInTheDocument()
    const after = within(detail).getByRole('region', { name: 'Datos posteriores' })
    expect(within(after).getByText('Autenticación multifactor obligatoria')).toBeInTheDocument()
    expect(within(after).getByText('Sí')).toBeInTheDocument()
    expect(within(detail).getByText('Datos anteriores')).toBeInTheDocument()
  })
  it('keeps unavailable references and unknown codes as secondary text', async () => {
    setup(true, [{ ...event, actorName: null, tenantName: null, entityName: null, action: 'ACCESS_REVIEWED', entityType: 'access_reviews', after: { roles: [{ role: 'ENERGY_MANAGER', active: true }] } }])
    const user = await openAudit()
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Registro no disponible')).toBeInTheDocument()
    expect(within(table).getByText('Acción registrada')).toBeInTheDocument()
    expect(within(table).getByText('ACCESS_REVIEWED').tagName).toBe('SMALL')
    await user.click(within(table).getByRole('button', { name: 'Ver detalle' }))
    const detail = await screen.findByRole('dialog')
    expect(within(detail).getByText('Responsable de energía')).toBeInTheDocument()
    expect(within(detail).getByText('ENERGY_MANAGER').tagName).toBe('SMALL')
    expect(within(detail).getByText(event.actorId!).tagName).toBe('SMALL')
  })
  it('translates readable labels in English while preserving technical references', async () => {
    setup(true, [event], 'en')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('tab', { name: 'Audit log' }))
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Security policy changed')).toBeInTheDocument()
    expect(within(table).getByText('Success')).toBeInTheDocument()
    expect(within(table).getByText(event.action).tagName).toBe('SMALL')
  })
  it('does not request events without permission', async () => {
    const result = setup(false)
    await openAudit()
    expect(screen.getByText('Tu rol no tiene permiso para consultar la auditoría.')).toBeInTheDocument()
    expect(result.list).not.toHaveBeenCalled()
  })
  it('distinguishes empty results from failed queries', async () => {
    const result = setup(true, [])
    const user = await openAudit()
    expect(await screen.findByText('No hay eventos para estos filtros.')).toBeInTheDocument()
    result.list.mockRejectedValueOnce(new Error('network unavailable'))
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText('No hay eventos para estos filtros.')).not.toBeInTheDocument()
  })
  it('labels the tax address change and shows the suspension reason', async () => {
    const changed: AuditEvent = { ...event, action: 'TENANT_UPDATED', module: 'ORGANIZATIONS', entityType: 'tenants', before: { taxAddress: 'Calle 1' }, after: { taxAddress: 'Calle 2' } }
    const suspended: AuditEvent = { ...event, id: '5d9f1c2a-3b4e-4f60-8a71-92b3c4d5e6f7', action: 'TENANT_SUSPENDED', entityType: 'tenants', reason: 'Falta de pago', before: { active: true }, after: { active: false } }
    setup(true, [changed, suspended])
    const user = await openAudit()
    const table = await screen.findByRole('table')
    await user.click(within(table).getAllByRole('button', { name: 'Ver detalle' })[0]!)
    expect(within(await screen.findByRole('dialog')).getAllByText('Domicilio fiscal').length).toBeGreaterThan(0)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(within(table).getAllByRole('button', { name: 'Ver detalle' })[1]!)
    expect(within(await screen.findByRole('dialog')).getByText('Falta de pago')).toBeInTheDocument()
  })
})
