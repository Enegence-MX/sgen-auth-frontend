import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from '../src/shared/i18n/create-i18n'
import { Pagination } from '../src/shared/ui/Pagination'
import { PaginationSamples } from '../src/features/styleguide/components/PaginationSamples'

const labels = { navigation: 'Paginación', previous: 'Anterior', next: 'Siguiente', page: (page: number) => `Página ${page}`, status: (page: number, pages: number) => `Página ${page} de ${pages}` }

function Example() {
  const [page, setPage] = useState(1)
  return <Pagination page={page} pageCount={1200} onPageChange={setPage} labels={labels} controls="results" />
}

describe('pagination', () => {
  it('bounds long navigation, marks the current page and supports keyboard activation', async () => {
    const user = userEvent.setup()
    render(<Example />)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getAllByRole('button').length).toBeLessThanOrEqual(9)
    await user.click(screen.getByRole('button', { name: 'Página 1200' }))
    expect(screen.getByRole('button', { name: 'Página 1200' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Página 1200 de 1200')
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Página 1198 de 1200')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveAttribute('aria-controls', 'results')
    await user.click(screen.getByRole('button', { name: 'Página 1' }))
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  })

  it('disables empty, single-page and explicitly disabled navigation', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Pagination page={1} pageCount={0} onPageChange={onChange} labels={labels} />)
    expect(screen.getByRole('status')).toHaveTextContent('Página 0 de 0')
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
    rerender(<Pagination page={10} pageCount={1} onPageChange={onChange} labels={labels} />)
    expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 1')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página 1' }))
    rerender(<Pagination page={3} pageCount={12} onPageChange={onChange} labels={labels} disabled />)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
      await user.click(button)
    }
    expect(onChange).not.toHaveBeenCalled()
  })

  it('paginates actual sample rows and resets the page after changing page size', async () => {
    const user = userEvent.setup()
    render(<I18nextProvider i18n={createI18n(['es'])}><PaginationSamples /></I18nextProvider>)
    const table = within(screen.getByRole('table', { name: 'Registros' }))
    const navigation = within(screen.getByRole('navigation', { name: 'Paginación numerada' }))
    expect(table.getAllByRole('row')).toHaveLength(6)
    expect(table.getByRole('cell', { name: '01' })).toBeInTheDocument()
    await user.click(navigation.getByRole('button', { name: 'Página 12' }))
    expect(table.getAllByRole('row')).toHaveLength(4)
    expect(table.getByRole('cell', { name: '58' })).toBeInTheDocument()
    expect(screen.getByText('56–58 de 58')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filas por página' }), '20')
    expect(table.getAllByRole('row')).toHaveLength(21)
    expect(table.getByRole('cell', { name: '01' })).toBeInTheDocument()
    expect(navigation.getByRole('status')).toHaveTextContent('Página 1 de 3')
    const compact = within(screen.getByRole('navigation', { name: 'Paginación compacta' }))
    await user.click(compact.getByRole('button', { name: 'Página siguiente' }))
    expect(compact.getByRole('status')).toHaveTextContent('Página 4 de 12')
    expect(navigation.getByRole('status')).toHaveTextContent('Página 1 de 3')
  })
})
