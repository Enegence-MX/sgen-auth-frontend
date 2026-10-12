import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { createI18n } from '../src/shared/i18n/create-i18n'
import IconCatalog from '../src/features/styleguide/components/IconCatalog'

function renderCatalog() {
  render(<I18nextProvider i18n={createI18n(['es'])}><IconCatalog /></I18nextProvider>)
  return within(screen.getByRole('list', { name: 'Catálogo de iconos Lucide' }))
}

describe('Lucide catalog', () => {
  it('pages through the catalog and resets pagination when searching different name formats', async () => {
    const user = userEvent.setup()
    const catalog = renderCatalog()
    const search = screen.getByRole('searchbox', { name: 'Buscar icono' })
    expect(catalog.getAllByRole('listitem')).toHaveLength(24)
    expect(catalog.getByText('AArrowDown')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(catalog.queryByText('AArrowDown')).not.toBeInTheDocument()
    expect(screen.getByText('25–48 de 1870')).toBeInTheDocument()
    for (const query of ['ArrowLeft', 'arrow left', 'ÁRROW-LEFT']) {
      await user.clear(search)
      await user.type(search, query)
      expect(catalog.getByText('ArrowLeft')).toBeInTheDocument()
      expect(catalog.queryByText('ArrowRight')).not.toBeInTheDocument()
    }
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(catalog.getByText('AArrowDown')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows an empty state and restores the complete catalog with keyboard focus', async () => {
    const user = userEvent.setup()
    const catalog = renderCatalog()
    const search = screen.getByRole('searchbox', { name: 'Buscar icono' })
    await user.type(search, 'zzzzinexistente')
    expect(catalog.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByText('Sin iconos')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver todos los iconos' }))
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(catalog.getAllByRole('listitem')).toHaveLength(24)
    await user.type(search, 'ZoomIn')
    expect(catalog.getAllByRole('listitem')).toHaveLength(1)
    expect(catalog.getByText('ZoomIn')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda de iconos' }))
    expect(search).toHaveFocus()
    expect(catalog.getAllByRole('listitem')).toHaveLength(24)
  })
})
