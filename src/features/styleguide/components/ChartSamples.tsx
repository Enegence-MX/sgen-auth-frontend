import { useTranslation } from 'react-i18next'
import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'
import { DataChart } from '../../../shared/ui/DataChart'

const labels = ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet', 'Elit']
const series = [
  { label: 'Lorem ipsum', values: [32, 48, 38, 68, 58, 84] },
  { label: 'Dolor sit', values: [22, 32, 28, 44, 40, 60] },
]
const examples = [
  { type: 'line', title: 'lineChart', labels, series },
  { type: 'bar', title: 'barChart', labels, series },
  { type: 'doughnut', title: 'doughnutChart', labels: ['Lorem', 'Ipsum', 'Dolor'], series: [{ label: 'Lorem ipsum', values: [52, 28, 20] }] },
  { type: 'radar', title: 'radarChart', labels, series },
] as const

export default function ChartSamples() {
  const { t } = useTranslation()
  const controls = { legend: t('styleguide.chartSeries'), viewData: t('styleguide.viewChartData'), category: t('styleguide.category') }
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      {examples.map((example) => <Card key={example.type} className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h3 className="m-0 font-heading text-base text-ink">{t(`styleguide.${example.title}`)}</h3><Badge>Chart.js</Badge></div>
        <DataChart type={example.type} label={t(`styleguide.${example.title}`)} labels={example.labels} series={example.series} controls={controls} />
      </Card>)}
    </div>
  )
}
