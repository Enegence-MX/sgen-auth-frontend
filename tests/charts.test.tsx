import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Chart } from 'react-chartjs-2'
import { DataChart } from '../src/shared/ui/DataChart'

// Chart.js canvas output is checked in a real browser. Capture its React boundary.
vi.mock('react-chartjs-2', () => ({ Chart: vi.fn(({ 'aria-label': label, id }: { 'aria-label'?: string; id?: string }) => <canvas id={id} role="img" aria-label={label} />) }))

const controls = { legend: 'Series', viewData: 'Ver datos', category: 'Categoría' }
const series = [{ label: 'Serie A', values: [32, 48] }, { label: 'Serie B', values: [20, 40] }]
const motion = Object.assign(new EventTarget(), { matches: false })

function chartProps() {
  const props = vi.mocked(Chart).mock.calls.at(-1)?.[0]
  if (!props) throw new Error('Chart was not rendered')
  return props
}

beforeEach(() => {
  vi.clearAllMocks()
  motion.matches = false
  vi.stubGlobal('matchMedia', () => motion)
  const original = globalThis.getComputedStyle
  vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
    const style = original(element)
    const getProperty = style.getPropertyValue.bind(style)
    const dark = element.closest('[data-theme]')?.getAttribute('data-theme') === 'dark'
    const tokens: Record<string, string> = {
      '--color-primary': dark ? '#A3B5FF' : '#465EAC',
      '--color-success-text': '#227454',
      '--color-warning-text': '#936014',
      '--color-danger-text': '#B3384B',
      '--color-text-muted': '#64738B',
      '--color-text': dark ? '#B2BFD5' : '#53627A',
      '--color-text-strong': '#18233D',
      '--color-border': '#DCE3EF',
      '--color-surface': '#FFFFFF',
      '--font-family-body': 'Manrope',
    }
    style.getPropertyValue = (name) => tokens[name] ?? getProperty(name)
    return style
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('shared charts', () => {
  it.each(['line', 'bar', 'radar'] as const)('toggles %s datasets with keyboard and exposes their values', async (type) => {
    const user = userEvent.setup()
    render(<DataChart type={type} label="Ejemplo" labels={['Lorem', 'Ipsum']} series={series} controls={controls} />)
    expect(screen.getByRole('img', { name: 'Ejemplo' })).toBeInTheDocument()
    const legend = within(screen.getByRole('group', { name: 'Series' }))
    const first = legend.getByRole('button', { name: 'Serie A' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(chartProps().data.datasets[0]).toMatchObject({ hidden: true, data: [32, 48] })
    await user.keyboard('{Enter}')
    expect(chartProps().data.datasets[0]).toMatchObject({ hidden: false })
    await user.click(screen.getByText('Ver datos'))
    const table = within(screen.getByRole('table', { name: 'Ejemplo' }))
    expect(table.getByRole('cell', { name: '48' })).toBeInTheDocument()
    expect(table.getByRole('columnheader', { name: 'Serie B' })).toBeInTheDocument()
  })

  it('toggles doughnut segments while keeping source values available in the table', async () => {
    const user = userEvent.setup()
    render(<DataChart type="doughnut" label="Dona" labels={['Lorem', 'Ipsum', 'Dolor']} series={[{ label: 'Total', values: [52, 28, 20] }]} controls={controls} />)
    await user.click(screen.getByRole('button', { name: 'Ipsum' }))
    expect(chartProps().data.datasets[0]?.data).toEqual([52, 0, 20])
    await user.click(screen.getByText('Ver datos'))
    expect(screen.getByRole('cell', { name: '28' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ipsum' }))
    expect(chartProps().data.datasets[0]?.data).toEqual([52, 28, 20])
  })

  it('updates scoped theme colors and reduced-motion preferences without global chart defaults', async () => {
    const { rerender } = render(<div data-theme="light"><DataChart type="line" label="Ejemplo" labels={['Lorem', 'Ipsum']} series={series} controls={controls} /></div>)
    expect(chartProps().data.datasets[0]?.borderColor).toBe('#465EAC')
    expect(chartProps().options).toMatchObject({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 } })
    rerender(<div data-theme="dark"><DataChart type="line" label="Ejemplo" labels={['Lorem', 'Ipsum']} series={series} controls={controls} /></div>)
    await waitFor(() => expect(chartProps().data.datasets[0]?.borderColor).toBe('#A3B5FF'))
    expect(chartProps().options?.color).toBe('#B2BFD5')
    act(() => { motion.matches = true; motion.dispatchEvent(new Event('change')) })
    await waitFor(() => expect(chartProps().options?.animation).toBe(false))
  })
})
