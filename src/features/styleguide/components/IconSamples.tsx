import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../shared/ui/Card'
import { Skeleton } from '../../../shared/ui/Loading'

const IconCatalog = lazy(() => import('./IconCatalog'))

export function IconSamples() {
  const { t } = useTranslation()
  const section = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (visible || !section.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    observer.observe(section.current)
    return () => observer.disconnect()
  }, [visible])
  const placeholder = <Card aria-busy="true" aria-label={t('styleguide.loading')}>
    <Skeleton className="mb-5 h-6 w-20" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="my-5 h-4 w-24" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 24 }, (_, index) => <Skeleton key={index} className="h-28" />)}</div>
    <div className="mt-6 border-0 border-t border-solid border-line pt-5"><Skeleton className="mx-auto h-11 w-48" /></div>
  </Card>
  return <div ref={section}><Suspense fallback={placeholder}>{visible ? <IconCatalog /> : placeholder}</Suspense></div>
}
