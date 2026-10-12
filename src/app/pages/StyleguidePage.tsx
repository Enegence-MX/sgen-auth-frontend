import { lazy, Suspense, useState, type ReactNode } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { DocumentMetadata } from '../router/DocumentMetadata'
import { ColorPalette, GridSamples, SpacingSamples, TypographySamples } from '../../features/styleguide/components/Foundations'
import { ButtonSamples, ExampleForm, FeedbackSamples } from '../../features/styleguide/components/ComponentSamples'
import { FieldSamples } from '../../features/styleguide/components/FieldSamples'
import { SelectionSamples } from '../../features/styleguide/components/SelectionSamples'
import { TableSamples } from '../../features/styleguide/components/TableSamples'
import { PaginationSamples } from '../../features/styleguide/components/PaginationSamples'
import { TabSamples, DropdownSamples } from '../../features/styleguide/components/NavigationSamples'
import { LoadingSamples } from '../../features/styleguide/components/LoadingSamples'
import { IconSamples } from '../../features/styleguide/components/IconSamples'
import { guideSections, type GuideSectionId } from '../../features/styleguide/guide-sections'
import { SearchSelectSamples } from '../../features/styleguide/components/SearchSelectSamples'
import { ModalSamples, ToastSamples, TooltipSamples } from '../../features/styleguide/components/OverlaySamples'
import { OverlayProvider } from '../../shared/ui/OverlayProvider'
import { ToastProvider } from '../../shared/ui/Toast'
import { StyleguideHeader, StyleguideSidebar } from '../../features/styleguide/components/StyleguideNavigation'
import { Skeleton } from '../../shared/ui/Loading'

const ChartSamples = lazy(() => import('../../features/styleguide/components/ChartSamples'))

function GuideSection({ id, index, title, children }: Readonly<{ id: string; index: string; title: string; children: ReactNode }>) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className="scroll-mt-28 focus:outline-none">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-solid border-brand/15 bg-brand-soft font-mono text-xs font-medium text-brand">{index}</span>
        <h2 id={`${id}-title`} className="m-0 font-heading text-lg font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function StyleguidePage() {
  const { i18n } = useTranslation()
  const [guideI18n] = useState(() => i18n.cloneInstance({ lng: 'es' }))
  return <I18nextProvider i18n={guideI18n}><StyleguideContent /></I18nextProvider>
}

function StyleguideContent() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [menuOpen, setMenuOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sectionContent: Record<GuideSectionId, ReactNode> = {
    palette: <ColorPalette theme={theme} />,
    typography: <><TypographySamples /><SpacingSamples /></>,
    icons: <IconSamples />,
    layouts: <GridSamples />,
    fields: <FieldSamples />,
    searchSelects: <SearchSelectSamples />,
    selection: <SelectionSamples />,
    components: <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2"><ButtonSamples /><ExampleForm /><div className="xl:col-span-2"><FeedbackSamples /></div></div>,
    tables: <TableSamples />,
    charts: <Suspense fallback={<Skeleton className="h-96" />}><ChartSamples /></Suspense>,
    pagination: <PaginationSamples />,
    tabs: <TabSamples />,
    menus: <DropdownSamples />,
    tooltips: <TooltipSamples />,
    modals: <ModalSamples />,
    toasts: <ToastSamples />,
    loadingStates: <LoadingSamples />,
  }
  return (
    <div data-theme={theme} className={`min-h-screen bg-canvas font-sans text-body [--guide-nav-height:4.5rem] ${theme === 'dark' ? 'scheme-dark' : 'scheme-light'}`}>
      <OverlayProvider>
        <ToastProvider label={t('styleguide.notifications')} closeLabel={t('styleguide.closeToast')}>
          <DocumentMetadata />
          <a href="#guide-main" onClick={() => setMenuOpen(false)} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-panel focus:p-4">{t('styleguide.skip')}</a>
          <StyleguideHeader menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} collapsed={sidebarCollapsed} onCollapseToggle={() => setSidebarCollapsed((collapsed) => !collapsed)} />
          <div className={`lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[248px_minmax(0,1fr)]'}`}>
            <StyleguideSidebar theme={theme} onThemeChange={setTheme} open={menuOpen} collapsed={sidebarCollapsed} onNavigate={() => setMenuOpen(false)} />
            <main id="guide-main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1400px] scroll-mt-28 px-5 py-8 focus:outline-none sm:px-8 sm:py-10 xl:px-12">
              <div className="mb-10 border-0 border-b border-solid border-line pb-8">
                <div className="mb-5">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-brand uppercase">{t('styleguide.eyebrow')}</span>
                </div>
                <h1 className="m-0 font-heading text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{t('styleguide.title')}</h1>
              </div>
              <div className="grid grid-cols-1 gap-12">
                {guideSections.map(({ id }, index) => <GuideSection key={id} id={id} index={String(index + 1).padStart(2, '0')} title={t(`styleguide.${id}`)}>{sectionContent[id]}</GuideSection>)}
              </div>
            </main>
          </div>
        </ToastProvider>
      </OverlayProvider>
    </div>
  )
}
