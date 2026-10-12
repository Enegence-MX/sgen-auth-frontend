import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Switch } from '../src/shared/ui/Switch'
import { TextField } from '../src/shared/ui/TextField'
import { TextArea } from '../src/shared/ui/TextArea'
import { SelectField } from '../src/shared/ui/SelectField'

describe('shared form controls', () => {
  it('preserves switch keyboard interaction, form values, reset and disabled fieldsets', async () => {
    const user = userEvent.setup()
    render(
      <form aria-label="Preferences">
        <Switch label="Updates" name="updates" defaultChecked />
        <fieldset disabled><Switch label="Locked" name="locked" defaultChecked /></fieldset>
        <button type="reset">Reset</button>
      </form>,
    )
    const control = screen.getByRole('switch', { name: 'Updates' })
    const form = screen.getByRole('form', { name: 'Preferences' }) as HTMLFormElement
    await user.tab()
    expect(control).toHaveFocus()
    await user.keyboard(' ')
    expect(control).not.toBeChecked()
    expect(new FormData(form).has('updates')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(control).toBeChecked()
    expect(new FormData(form).get('updates')).toBe('on')
    expect(screen.getByRole('switch', { name: 'Locked' })).toBeDisabled()
    expect(new FormData(form).has('locked')).toBe(false)
  })

  it('links errors and hints, keeps external descriptions and submits native field values', async () => {
    const user = userEvent.setup()
    render(
      <form aria-label="Details">
        <p id="context">Context</p>
        <TextField label="Name" name="name" defaultValue="Lorem" readOnly hint="Hint" aria-describedby="context" />
        <TextArea label="Description" name="description" hint="Unused hint" error="Invalid description" />
        <SelectField label="Category" name="category" hint="Choose a category"><option value="one">One</option><option value="two">Two</option></SelectField>
      </form>,
    )
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Context Hint')
    expect(screen.getByLabelText('Description')).toHaveAccessibleDescription('Invalid description')
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category')
    await user.type(screen.getByLabelText('Description'), 'Lorem ipsum')
    await user.selectOptions(screen.getByLabelText('Category'), 'two')
    const values = new FormData(screen.getByRole('form', { name: 'Details' }) as HTMLFormElement)
    expect(Object.fromEntries(values)).toEqual({ name: 'Lorem', description: 'Lorem ipsum', category: 'two' })
  })
})
