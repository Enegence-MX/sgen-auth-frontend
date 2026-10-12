import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, RotateCcw } from 'lucide-react'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Progress, Skeleton, Spinner } from '../../../shared/ui/Loading'

export function LoadingSamples() {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(60)
  const [running, setRunning] = useState(false)
  const [skeleton, setSkeleton] = useState(true)
  const busy = running && progress < 100
  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setProgress(Math.min(progress + 20, 100)), 500)
    return () => clearTimeout(timer)
  }, [busy, progress])
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.spinners')}</h3>
        <div className="flex min-h-12 flex-wrap items-center gap-6">{(['sm', 'md', 'lg'] as const).map((size) => <Spinner key={size} label={t('styleguide.loading')} size={size} />)}<Button loading>{t('styleguide.loading')}</Button></div>
      </Card>
      <Card>
        <h3 className="mt-0 mb-6 font-heading text-base text-ink">{t('styleguide.progress')}</h3>
        <div className="grid gap-6"><Progress label="Lorem ipsum" value={progress} /><Progress label="Dolor sit amet" value={null} /></div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><Button variant="secondary" size="sm" loading={busy} onClick={() => { setProgress(0); setRunning(true) }}>{!busy && <Play size={16} aria-hidden="true" />}{t(busy ? 'styleguide.loading' : 'styleguide.playLoading')}</Button><span role="status" className="text-sm text-brand">{running && !busy ? t('styleguide.complete') : ''}</span></div>
      </Card>
      <Card className="xl:col-span-2">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h3 className="m-0 font-heading text-base text-ink">{t('styleguide.skeletons')}</h3><Button variant="ghost" size="sm" onClick={() => setSkeleton((current) => !current)}><RotateCcw size={16} aria-hidden="true" />{t(skeleton ? 'styleguide.showContent' : 'styleguide.showLoading')}</Button></div>
        <span role="status" className="sr-only">{t(skeleton ? 'styleguide.loading' : 'styleguide.complete')}</span>
        <div aria-busy={skeleton} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="min-h-44 rounded-control border border-solid border-line p-5">{skeleton ? <><div className="mb-5 flex items-center gap-3"><Skeleton className="size-11 shrink-0 rounded-full" /><div className="grid flex-1 gap-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div><div className="grid gap-2.5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-2/3" /></div></> : <><h4 className="mt-0 mb-3 font-heading text-base text-ink">Lorem ipsum</h4><p className="m-0 text-sm leading-relaxed">{t('styleguide.bodySample')}</p></>}</div>
          <div className="grid min-h-44 gap-4 rounded-control border border-solid border-line p-5">{['Lorem ipsum', 'Dolor sit amet', 'Consectetur adipiscing'].map((text) => <div key={text} className="flex items-center gap-4">{skeleton ? <><Skeleton className="size-8 shrink-0" /><Skeleton className="h-3 flex-1" /><Skeleton className="h-5 w-12" /></> : <p className="m-0 text-sm text-ink">{text}</p>}</div>)}</div>
        </div>
      </Card>
    </div>
  )
}
