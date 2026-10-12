import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from '../src/shared/ui/Tabs'
import { Button } from '../src/shared/ui/Button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuItem } from '../src/shared/ui/DropdownMenu'
import { OverlayProvider } from '../src/shared/ui/OverlayProvider'
import { Progress } from '../src/shared/ui/Loading'
import { LoadingSamples } from '../src/features/styleguide/components/LoadingSamples'
import { createI18n } from '../src/shared/i18n/create-i18n'

function MenuExample({ onAction }: Readonly<{ onAction: () => void }>) {
  const [checked, setChecked] = useState(false)
  return <div data-theme="dark"><OverlayProvider><DropdownMenu trigger={<Button>Acciones</Button>}><DropdownMenuItem onClick={onAction}>Editar</DropdownMenuItem><DropdownMenuItem disabled>Deshabilitado</DropdownMenuItem><DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>Nombre</DropdownMenuCheckboxItem></DropdownMenu></OverlayProvider></div>
}

describe('tabs, menus and loading', () => {
  it('navigates tabs with arrows, prevents disabled activation and associates panels', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Pestañas" items={[{ value: 'one', label: 'Uno', content: 'Lorem ipsum' }, { value: 'disabled', label: 'Deshabilitado', disabled: true, content: 'Hidden' }, { value: 'two', label: 'Dos', content: 'Dolor sit amet' }]} />)
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Deshabilitado' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel', { name: 'Uno' })).toHaveTextContent('Lorem ipsum')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Dos' })).toHaveTextContent('Dolor sit amet')
    expect(screen.queryByRole('tabpanel', { name: 'Uno' })).not.toBeInTheDocument()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tabpanel', { name: 'Uno' })).toHaveTextContent('Lorem ipsum')
  })

  it('opens the menu with keyboard, prevents disabled actions and restores focus', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<MenuExample onAction={onAction} />)
    const trigger = screen.getByRole('button', { name: 'Acciones' })
    await user.tab()
    await user.keyboard('{ArrowDown}')
    const menu = await screen.findByRole('menu')
    expect(menu.closest('[data-theme]')).toHaveAttribute('data-theme', 'dark')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Editar' })).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitem', { name: 'Deshabilitado' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Enter}')
    expect(onAction).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Nombre' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Nombre' })).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    expect(onAction).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('distinguishes determined and undetermined progress for assistive technology', () => {
    render(<><Progress label="Lorem ipsum" value={60} /><Progress label="Dolor sit" value={null} /></>)
    expect(screen.getByRole('progressbar', { name: 'Lorem ipsum' })).toHaveAttribute('aria-valuenow', '60')
    expect(screen.getByRole('progressbar', { name: 'Dolor sit' })).not.toHaveAttribute('aria-valuenow')
  })

  it('completes the loading demo and lets skeletons reveal their content', async () => {
    vi.useFakeTimers()
    try {
      render(<I18nextProvider i18n={createI18n(['es'])}><LoadingSamples /></I18nextProvider>)
      fireEvent.click(screen.getByRole('button', { name: 'Reproducir carga' }))
      expect(screen.getByRole('progressbar', { name: 'Lorem ipsum' })).toHaveAttribute('aria-valuenow', '0')
      for (let tick = 0; tick < 5; tick += 1) await act(async () => { await vi.advanceTimersByTimeAsync(500) })
      expect(screen.getByRole('progressbar', { name: 'Lorem ipsum' })).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('Completado')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Mostrar contenido' }))
      expect(screen.getByRole('heading', { name: 'Lorem ipsum' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Mostrar carga' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
