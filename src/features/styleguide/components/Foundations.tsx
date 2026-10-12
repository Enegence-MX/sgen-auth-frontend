import { useTranslation } from 'react-i18next'
import { Building2, Settings2, Users } from 'lucide-react'
import { Card } from '../../../shared/ui/Card'

const palette = [
  { label: 'navy', color: 'bg-navy', light: '#161B3F', dark: '#161B3F' },
  { label: 'primary', color: 'bg-brand', light: '#465EAC', dark: '#A3B5FF' },
  { label: 'strong', color: 'bg-ink', light: '#18233D', dark: '#F0F4FC' },
  { label: 'body', color: 'bg-body', light: '#53627A', dark: '#B2BFD5' },
  { label: 'surface', color: 'bg-panel', light: '#FFFFFF', dark: '#172238' },
  { label: 'background', color: 'bg-canvas', light: '#F4F6FB', dark: '#0D1424' },
] as const

const semanticPalette = [
  { label: 'information', className: 'border-brand/15 bg-brand-soft text-brand', color: 'bg-brand', light: '#465EAC', dark: '#A3B5FF' },
  { label: 'success', className: 'border-positive/20 bg-positive-surface text-positive', color: 'bg-positive', light: '#227454', dark: '#8ADBBC' },
  { label: 'review', className: 'border-caution/20 bg-caution-surface text-caution', color: 'bg-caution', light: '#936014', dark: '#F2CD86' },
  { label: 'error', className: 'border-negative/20 bg-negative-surface text-negative', color: 'bg-negative', light: '#B3384B', dark: '#FFADB8' },
] as const

export function ColorPalette({ theme }: Readonly<{ theme: 'light' | 'dark' }>) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {palette.map((color) => (
          <div key={color.label} className="overflow-hidden rounded-card border border-solid border-line bg-panel shadow-card">
            <div className={`h-24 border-0 border-b border-solid border-line ${color.color}`} />
            <div className="p-3.5">
              <p className="m-0 text-xs font-semibold text-ink">{t(`styleguide.${color.label}`)}</p>
              <p className="mt-1.5 mb-0 font-mono text-xs text-body">{color[theme]}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {semanticPalette.map((color) => <div key={color.label} className={`flex min-w-0 items-center gap-3 rounded-control border border-solid p-3.5 ${color.className}`}>
          <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${color.color}`} />
          <div><p className="m-0 text-xs font-semibold">{t(`styleguide.${color.label}`)}</p><p className="mt-1 mb-0 font-mono text-xs">{color[theme]}</p></div>
        </div>)}
      </div>
    </div>
  )
}

export function TypographySamples() {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between gap-4 text-xs text-body"><span>{t('styleguide.headingLabel')}</span><span>Sora · 600</span></div>
        <p className="mt-6 mb-2 font-heading text-5xl font-semibold leading-tight text-ink">Aa</p>
        <p className="mt-4 mb-0 font-heading text-2xl font-semibold leading-snug text-ink">{t('styleguide.displaySample')}</p>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-4 text-xs text-body"><span>{t('styleguide.bodyLabel')}</span><span>Manrope · 400 / 600</span></div>
        <p className="mt-6 mb-3 text-xl font-semibold text-ink">{t('styleguide.typeScale')}</p>
        <p className="m-0 max-w-md text-base leading-relaxed text-body">{t('styleguide.bodySample')}</p>
        <p className="mt-5 mb-0 font-mono text-xs text-body">12 / 14 / 16 / 20 / 24 / 32</p>
      </Card>
    </div>
  )
}

const spacing = [
  { value: 4, className: 'w-1' },
  { value: 8, className: 'w-2' },
  { value: 12, className: 'w-3' },
  { value: 16, className: 'w-4' },
  { value: 24, className: 'w-6' },
  { value: 32, className: 'w-8' },
  { value: 48, className: 'w-12' },
] as const

export function SpacingSamples() {
  const { t } = useTranslation()
  return (
    <Card className="mt-4">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <h3 className="mt-0 mb-5 font-heading text-sm text-ink">{t('styleguide.spacing')}</h3>
          <div className="flex flex-wrap items-end gap-5">
            {spacing.map(({ value, className }) => <div key={value} className="flex flex-col items-center gap-2"><div className={`h-6 rounded-sm bg-brand/70 ${className}`} /><span className="font-mono text-xs text-body">{value}</span></div>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 md:justify-end">
          <div className="rounded-control border border-solid border-line bg-subtle p-5 text-xs text-body">{t('styleguide.controlRadius')}</div>
          <div className="rounded-card border border-solid border-line bg-subtle p-5 text-xs text-body">{t('styleguide.cardRadius')}</div>
        </div>
      </div>
    </Card>
  )
}

const gridCards = [
  { label: 'gridOne', Icon: Building2 },
  { label: 'gridTwo', Icon: Users },
  { label: 'gridThree', Icon: Settings2 },
] as const

export function GridSamples() {
  const { t } = useTranslation()
  return (
    <div>
      <h3 className="mt-0 mb-5 font-heading text-base text-ink">{t('styleguide.gridTitle')}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="responsive-grid">
        {gridCards.map(({ label, Icon }) => (
          <Card key={label}>
            <div className="mb-5 flex size-10 items-center justify-center rounded-control bg-brand-soft text-brand"><Icon size={20} aria-hidden="true" /></div>
            <h4 className="m-0 text-base font-semibold text-ink">{t(`styleguide.${label}`)}</h4>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-body">{t('styleguide.gridCardHint')}</p>
          </Card>
        ))}
      </div>
      <details className="mt-4 rounded-control border border-solid border-line bg-panel p-4 text-sm text-body">
        <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-brand">{t('styleguide.code')}</summary>
        <pre className="mt-4 mb-0 overflow-x-auto rounded-control bg-subtle p-4 text-xs leading-relaxed text-ink"><code>{'<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">\n  <Card>...</Card>\n  <Card>...</Card>\n  <Card>...</Card>\n</div>'}</code></pre>
      </details>
    </div>
  )
}
