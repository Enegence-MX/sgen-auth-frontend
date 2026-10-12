import type { ChartOptions } from 'chart.js'
import type { ChartTheme } from './use-chart-theme'

export type DataChartType = 'line' | 'bar' | 'doughnut' | 'radar'

export function chartOptions(type: DataChartType, theme: ChartTheme, locale: string): ChartOptions<DataChartType> {
  const options: ChartOptions<DataChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    locale,
    animation: theme.reducedMotion ? false : { duration: 350 },
    color: theme.text,
    font: { family: theme.font, size: 12 },
    layout: { padding: 4 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.strong,
        bodyColor: theme.text,
        borderColor: theme.border,
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        boxPadding: 5,
        usePointStyle: true,
        titleFont: { family: theme.font, weight: 600 },
        bodyFont: { family: theme.font },
      },
    },
  }
  if (type === 'doughnut') {
    return { ...options, cutout: '72%', interaction: { mode: 'nearest', intersect: true } }
  }
  if (type === 'radar') {
    return { ...options, scales: { r: {
      beginAtZero: true,
      grid: { color: theme.border },
      angleLines: { color: theme.border },
      pointLabels: { color: theme.text, font: { family: theme.font, size: 11 } },
      ticks: { display: false, maxTicksLimit: 5 },
    } } }
  }
  return { ...options, scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: theme.text, maxRotation: 0, font: { family: theme.font, size: 11 } } },
    y: { beginAtZero: true, border: { display: false }, grid: { color: theme.border, drawTicks: false }, ticks: { color: theme.text, maxTicksLimit: 5, padding: 10, font: { family: theme.font, size: 11 } } },
  } }
}
