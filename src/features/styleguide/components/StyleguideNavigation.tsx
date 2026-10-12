import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ChevronRight, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from 'lucide-react'
import { guideGroups, guideSections } from '../guide-sections'
import { useActiveGuideSection } from '../use-active-guide-section'
import { UserMenu } from '../../../shared/ui/UserMenu'
import { useToasts } from '../../../shared/ui/use-toasts'

type Theme = 'light' | 'dark'

function ThemeControl({ theme, onChange, collapsed }: Readonly<{ theme: Theme; onChange: (theme: Theme) => void; collapsed: boolean }>) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('styleguide.theme')} className={`flex shrink-0 gap-1 rounded-xl border border-solid border-line bg-subtle p-1 ${collapsed ? 'lg:flex-col' : ''}`}>
      {(['light', 'dark'] as const).map((value) => {
        const Icon = value === 'light' ? Sun : Moon
        return (
          <button
            key={value}
            type="button"
            aria-label={t(`styleguide.${value}`)}
            title={t(`styleguide.${value}`)}
            aria-pressed={theme === value}
            onClick={() => onChange(value)}
            className={`inline-flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 px-2 font-sans text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${collapsed ? 'lg:px-0' : ''} ${theme === value ? 'bg-panel text-brand shadow-control ring-1 ring-inset ring-line' : 'bg-transparent text-body hover:bg-panel/60 hover:text-ink'}`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className={collapsed ? 'lg:hidden' : ''}>{t(`styleguide.${value}`)}</span>
          </button>
        )
      })}
    </div>
  )
}

interface HeaderProps {
  menuOpen: boolean
  onMenuToggle: () => void
  collapsed: boolean
  onCollapseToggle: () => void
}

export function StyleguideHeader({ menuOpen, onMenuToggle, collapsed, onCollapseToggle }: Readonly<HeaderProps>) {
  const { t } = useTranslation()
  const toasts = useToasts()
  const previewAction = (title: string) => toasts.add({ title, description: t('styleguide.fieldHint'), type: 'info' })
  const menuButton = useRef<HTMLButtonElement>(null)
  const activeSection = useActiveGuideSection()
  const currentSection = guideSections.find(({ id }) => id === activeSection) ?? guideSections[0]
  const SectionIcon = currentSection.Icon
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const collapseLabel = t(collapsed ? 'styleguide.expandNavigation' : 'styleguide.collapseNavigation')
  useEffect(() => {
    if (!menuOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !menuButton.current?.getClientRects().length) return
      onMenuToggle()
      menuButton.current.focus()
    }
    globalThis.addEventListener('keydown', handleEscape)
    return () => globalThis.removeEventListener('keydown', handleEscape)
  }, [menuOpen, onMenuToggle])
  const MenuIcon = menuOpen ? X : Menu
  return (
    <header className={`sticky top-0 z-30 flex h-(--guide-nav-height) w-full items-center border-0 border-b border-solid border-white/10 bg-navy text-white shadow-[0_4px_18px_-6px_rgba(22,27,63,0.35)] lg:grid ${collapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[248px_minmax(0,1fr)]'}`}>
      <div className={`flex h-full min-w-0 shrink-0 items-center gap-2 pl-3 lg:border-0 lg:border-r lg:border-solid lg:border-white/10 ${collapsed ? 'lg:justify-center lg:px-0' : 'lg:px-6'}`}>
        <button ref={menuButton} id="guide-menu-toggle" type="button" aria-label={t(menuOpen ? 'styleguide.closeNavigation' : 'styleguide.openNavigation')} aria-expanded={menuOpen} aria-controls="guide-sidebar" onClick={onMenuToggle} className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-solid font-sans transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden ${menuOpen ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'}`}><MenuIcon size={20} aria-hidden="true" /></button>
        <a href="#guide-main" aria-label={t('styleguide.guideHome')} onClick={() => { if (menuOpen) onMenuToggle() }} className="inline-flex min-h-11 min-w-0 items-center gap-2.5 rounded-control text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white sm:gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white shadow-sm sm:size-10"><img src="/assets/logo-simbolo.png" alt="" className="block size-7 object-contain sm:size-8" /></span>
          <span className={`font-heading text-lg font-semibold leading-none tracking-tight sm:text-xl ${collapsed ? 'lg:hidden' : ''}`}>SGEn</span>
        </a>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pr-3 pl-2 sm:gap-3 sm:pr-5 lg:justify-between lg:px-5 xl:pr-8">
        <div className="hidden min-w-0 items-center gap-4 lg:flex">
          <button type="button" title={collapseLabel} aria-label={collapseLabel} aria-expanded={!collapsed} aria-controls="guide-sidebar-links" onClick={onCollapseToggle} className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-solid border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><CollapseIcon size={20} aria-hidden="true" /></button>
          <nav aria-label={t('styleguide.currentLocation')} className="flex min-w-0 items-center gap-3 text-sm">
            <a href="#guide-main" className="shrink-0 rounded text-white/65 no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">{t('styleguide.title')}</a>
            <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-white/35" />
            <span aria-current="location" className="inline-flex min-w-0 items-center gap-2.5 font-semibold"><SectionIcon size={17} aria-hidden="true" className="shrink-0 text-white/70" /><span className="truncate">{t(`styleguide.${currentSection.id}`)}</span></span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link to="/" aria-label={t('styleguide.return')} title={t('styleguide.return')} className="hidden min-h-11 items-center justify-center gap-2 rounded-control border border-solid border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/90 no-underline transition-colors hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex"><span className="hidden xl:inline">{t('styleguide.application')}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>
          <UserMenu user={{ name: 'Lorem Ipsum', email: 'lorem.ipsum@example.com', organization: 'Dolor sit amet', role: 'Lorem ipsum' }} labels={{ menu: t('styleguide.userMenu'), session: t('styleguide.sessionDetails'), organization: t('styleguide.organization'), role: t('styleguide.sessionRole'), settings: t('styleguide.settings'), signOut: t('styleguide.signOut') }} onSettings={() => previewAction(t('styleguide.settings'))} onSignOut={() => previewAction(t('styleguide.signOut'))} />
        </div>
      </div>
    </header>
  )
}

interface SidebarProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  open: boolean
  collapsed: boolean
  onNavigate: () => void
}

export function StyleguideSidebar({ theme, onThemeChange, open, collapsed, onNavigate }: Readonly<SidebarProps>) {
  const { t } = useTranslation()
  const activeSection = useActiveGuideSection()
  return (
    <aside id="guide-sidebar" className={`${open ? 'flex' : 'hidden'} fixed top-(--guide-nav-height) left-0 z-20 h-[calc(100dvh-var(--guide-nav-height))] w-[248px] max-w-[calc(100vw-48px)] flex-col overflow-hidden border-0 border-r border-solid border-line bg-panel shadow-surface lg:sticky lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:self-start lg:shadow-none`}>
      <div className={`flex h-14 shrink-0 items-center gap-2 px-6 ${collapsed ? 'lg:hidden' : ''}`}>
        <p className={`m-0 text-[10px] font-bold tracking-[0.15em] text-body uppercase ${collapsed ? 'lg:sr-only' : ''}`}>{t('styleguide.title')}</p>
      </div>
      <nav id="guide-sidebar-links" aria-label={t('styleguide.navigation')} className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:thin] ${collapsed ? 'lg:pt-4' : ''}`}>
        <div className="grid gap-5">
          {guideGroups.map((group) => {
            const sections = guideSections.filter((section) => section.group === group)
            if (sections.length === 0) return null
            return <div key={group}>
              <p className={`mt-0 mb-2 px-3 text-[10px] font-bold tracking-wider text-body uppercase ${collapsed ? 'lg:sr-only' : ''}`}>{t(`styleguide.${group}`)}</p>
              <div className="grid gap-1">{sections.map(({ id, Icon }) => {
                const active = activeSection === id
                return <a key={id} href={`#${id}`} aria-label={t(`styleguide.${id}`)} title={t(`styleguide.${id}`)} aria-current={active ? 'location' : undefined} onClick={onNavigate} className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${collapsed ? 'lg:justify-center lg:gap-0' : ''} ${active ? 'bg-brand-soft font-semibold text-brand ring-1 ring-inset ring-brand/10' : 'font-medium text-body hover:bg-subtle hover:text-ink'}`}>
                  <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${active ? 'bg-brand' : 'bg-transparent'}`} />
                  <Icon size={18} strokeWidth={active ? 2 : 1.7} aria-hidden="true" className="shrink-0" />
                  <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{t(`styleguide.${id}`)}</span>
                  <ChevronRight size={14} aria-hidden="true" className={`shrink-0 ${collapsed ? 'lg:hidden' : ''} ${active ? 'opacity-80' : 'opacity-0 group-hover:opacity-50'}`} />
                </a>
              })}</div>
            </div>
          })}
        </div>
      </nav>
      <div className={`shrink-0 border-0 border-t border-solid border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${collapsed ? 'lg:px-3' : ''}`}>
        <ThemeControl theme={theme} onChange={onThemeChange} collapsed={collapsed} />
      </div>
    </aside>
  )
}
