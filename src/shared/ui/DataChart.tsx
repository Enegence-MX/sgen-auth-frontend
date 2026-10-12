import { useId, useRef, useState } from 'react'
import { ArcElement, BarController, BarElement, CategoryScale, Chart as ChartJS, DoughnutController, Filler, LinearScale, LineController, LineElement, PointElement, RadarController, RadialLinearScale, Tooltip, type ChartData } from 'chart.js'
import { color } from 'chart.js/helpers'
import { Chart } from 'react-chartjs-2'
import { ChevronDown, Table2 } from 'lucide-react'
import { chartOptions, type DataChartType } from './chart-options'
import { useChartTheme } from './use-chart-theme'
import { Skeleton } from './Loading'
import { Table } from './Table'

ChartJS.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler, LinearScale, LineController, LineElement, PointElement, RadarController, RadialLinearScale, Tooltip)

interface DataSeries {
  label: string
  values: readonly number[]
}

interface DataChartProps {
  type: DataChartType
  label: string
  labels: readonly string[]
  series: readonly DataSeries[]
  locale?: string
  controls: { legend: string; viewData: string; category: string }
}

export function DataChart({ type, label, labels, series, controls, locale = 'es-MX' }: Readonly<DataChartProps>) {
  const id = useId()
  const host = useRef<HTMLElement>(null)
  const theme = useChartTheme(host)
  const [hidden, setHidden] = useState<number[]>([])
  const legend = type === 'doughnut' ? labels : series.map((item) => item.label)
  const fillOpacity = type === 'radar' ? 0.12 : 0.08
  const seriesColor = (index: number) => theme?.series[index % theme.series.length] ?? theme?.primary ?? 'currentColor'
  const data: ChartData<DataChartType, number[], string> = {
    labels: [...labels],
    datasets: series.map((item, index) => ({
      label: item.label,
      data: item.values.map((value, itemIndex) => type === 'doughnut' && hidden.includes(itemIndex) ? 0 : value),
      hidden: type !== 'doughnut' && hidden.includes(index),
      borderColor: type === 'doughnut' ? theme?.surface : seriesColor(index),
      backgroundColor: type === 'doughnut' ? labels.map((_, itemIndex) => seriesColor(itemIndex)) : seriesColor(index),
      borderWidth: type === 'doughnut' ? 3 : 2,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 28,
      spacing: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: theme?.surface,
      pointBorderWidth: 2,
      cubicInterpolationMode: type === 'line' ? 'monotone' : 'default',
      ...(type === 'line' || type === 'radar' ? {
        backgroundColor: theme ? color(seriesColor(index)).alpha(fillOpacity).rgbString() : 'transparent',
        fill: type === 'radar' || index === 0,
        borderDash: index % 2 ? [5, 4] : [],
      } : {}),
    })),
  }

  return (
    <figure ref={host} aria-labelledby={`${id}-caption`} className="m-0 min-w-0">
      <figcaption id={`${id}-caption`} className="sr-only">{label}</figcaption>
      <div className="relative h-64 min-w-0 sm:h-72">
        {theme ? <Chart id={`${id}-canvas`} type={type} data={data} options={chartOptions(type, theme, locale)} role="img" aria-label={label} /> : <Skeleton className="size-full" />}
      </div>
      <div role="group" aria-label={controls.legend} className="mt-4 flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {legend.map((name, index) => <button key={`${index}-${name}`} type="button" aria-pressed={!hidden.includes(index)} aria-controls={`${id}-canvas`} onClick={() => setHidden((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border-0 bg-transparent px-2 py-2 font-sans text-xs font-medium transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand ${hidden.includes(index) ? 'text-muted line-through opacity-60' : 'text-body'}`}><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: seriesColor(index) }} />{name}</button>)}
      </div>
      <details className="group mt-4 border-0 border-t border-solid border-line pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control text-xs font-semibold text-body hover:text-brand focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden"><Table2 size={15} aria-hidden="true" />{controls.viewData}<ChevronDown size={15} aria-hidden="true" className="ml-auto transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
        <div className="mt-3"><Table caption={label}>
          <thead><tr><th scope="col">{controls.category}</th>{series.map((item) => <th key={item.label} scope="col">{item.label}</th>)}</tr></thead>
          <tbody>{labels.map((name, index) => <tr key={`${index}-${name}`}><th scope="row">{name}</th>{series.map((item) => <td key={item.label} className="tabular-nums">{item.values[index]?.toLocaleString(locale) ?? '—'}</td>)}</tr>)}</tbody>
        </Table></div>
      </details>
    </figure>
  )
}
