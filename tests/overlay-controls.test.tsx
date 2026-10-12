import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Modal } from '../src/shared/ui/Modal'
import { Tooltip } from '../src/shared/ui/Tooltip'
import { SearchSelect } from '../src/shared/ui/SearchSelect'
import { ToastProvider } from '../src/shared/ui/Toast'
import { useToasts } from '../src/shared/ui/use-toasts'
import { OverlayProvider } from '../src/shared/ui/OverlayProvider'
import { Button } from '../src/shared/ui/Button'

const options = [{ value: 'one', label: 'Lorem ipsum' }, { value: 'two', label: 'Dolor sit amet' }, { value: 'three', label: 'Dolor disabled', disabled: true }]
const labels = { placeholder: 'Search', empty: 'No results', toggle: 'Show options', clear: 'Clear', selected: 'Selected', remove: (label: string) => `Remove ${label}` }

function SelectExample() {
  const [value, setValue] = useState<string | null>(null)
  const [values, setValues] = useState<string[]>(['one'])
  return <form aria-label="Selections"><SearchSelect label="Category" name="category" options={options} labels={labels} value={value} onValueChange={setValue} /><SearchSelect label="Categories" name="categories" options={options} labels={labels} multiple value={values} onValueChange={setValues} /></form>
}

function ModalExample() {
  const [open, setOpen] = useState(false)
  return <div data-theme="dark"><OverlayProvider><Modal trigger={<Button>Open</Button>} open={open} onOpenChange={setOpen} title="Example" description="Lorem ipsum" closeLabel="Close" footer={<Button onClick={() => setOpen(false)}>Done</Button>}><input aria-label="Name" /></Modal></OverlayProvider></div>
}

function ToastExample() {
  const toasts = useToasts()
  return <Button onClick={() => toasts.add({ title: 'Saved', description: 'Lorem ipsum', type: 'success' })}>Notify</Button>
}

describe('overlay controls', () => {
  it('filters selectable options, supports keyboard choice and submits stable values', async () => {
    const user = userEvent.setup()
    render(<SelectExample />)
    const input = screen.getByRole('combobox', { name: 'Category' })
    await user.type(input, 'Dolor')
    expect(await screen.findByRole('option', { name: 'Dolor sit amet' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Lorem ipsum' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dolor disabled' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('Dolor sit amet')
    expect(new FormData(screen.getByRole('form', { name: 'Selections' }) as HTMLFormElement).get('category')).toBe('two')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    await user.type(input, 'Not present')
    expect(await screen.findByText('No results')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    const multiple = screen.getByRole('combobox', { name: 'Categories' })
    await user.type(multiple, 'Dolor')
    await user.click(await screen.findByRole('option', { name: 'Dolor sit amet' }))
    await user.keyboard('{Escape}')
    expect(new FormData(screen.getByRole('form', { name: 'Selections' }) as HTMLFormElement).getAll('categories')).toEqual(['one', 'two'])
    await user.click(screen.getByRole('button', { name: 'Remove Lorem ipsum' }))
    expect(new FormData(screen.getByRole('form', { name: 'Selections' }) as HTMLFormElement).getAll('categories')).toEqual(['two'])
  })

  it('keeps the modal themed, traps focus and restores its trigger on Escape', async () => {
    const user = userEvent.setup()
    render(<ModalExample />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Example' })
    expect(dialog.closest('[data-theme]')).toHaveAttribute('data-theme', 'dark')
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus())
    await user.tab({ shift: true })
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Done' })).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Example' })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('opens a tooltip on keyboard focus and dismisses it with Escape', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="Lorem ipsum"><Button>Help</Button></Tooltip>)
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Lorem ipsum')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('announces and dismisses a toast without stealing focus', async () => {
    const user = userEvent.setup()
    render(<div data-theme="dark"><OverlayProvider><ToastProvider label="Notifications" closeLabel="Dismiss"><ToastExample /></ToastProvider></OverlayProvider></div>)
    const trigger = screen.getByRole('button', { name: 'Notify' })
    await user.click(trigger)
    const toast = await screen.findByRole('dialog', { name: 'Saved' })
    expect(toast).toHaveTextContent('Lorem ipsum')
    expect(toast.closest('[data-theme]')).toHaveAttribute('data-theme', 'dark')
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveAttribute('aria-live', 'polite')
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Saved' })).not.toBeInTheDocument())
  })
})
