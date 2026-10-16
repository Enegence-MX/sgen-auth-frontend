import { useState, useEffect, useRef } from 'react'
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, Menu, Palette, PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from 'lucide-react'
import { useServices, useSession } from '../services/services-context'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Spinner } from '../../shared/ui/Loading'
import { UserMenu } from '../../shared/ui/UserMenu'
import type { SessionState } from '../../features/auth/model/session-store'
import { OverlayProvider } from '../../shared/ui/OverlayProvider'
import { Notice } from '../../shared/ui/Notice'
import { LinkButton } from '../../shared/ui/LinkButton'

const headerControl = 'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-solid border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none'

function useSessionPreferences() {
  const { i18n } = useTranslation()
  const state = useSession()
  const preferredLanguage = state.status === 'authenticated' ? state.session.identity.language : undefined
  const preferredTheme = state.status === 'authenticated' ? state.session.identity.theme : undefined

  useEffect(() => {
    if (preferredLanguage && i18n.resolvedLanguage !== preferredLanguage) {
      void i18n.changeLanguage(preferredLanguage)
    }
    if (preferredTheme) {
      document.documentElement.classList.toggle('dark', preferredTheme === 'dark')
    }
  }, [preferredLanguage, preferredTheme, i18n])

}

export function ProtectedLayout() {
  const { t } = useTranslation()
  useSessionPreferences()
  const { auth } = useServices()
  const state = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    globalThis.addEventListener('keydown', closeOnEscape)
    return () => globalThis.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  async function logout() {
    setBusy(true)
    setError(undefined)
    try {
      await auth.logout()
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  if (state.status !== 'authenticated') return <SessionFallback state={state} onRetry={() => { void auth.restore() }} />

  const { session } = state
  if (session.password?.changeRequired && location.pathname !== '/password') return <Navigate to="/password" replace />
  const platform = session.context.accessMode === 'PLATFORM_SUPERADMIN'
  const modeLabel = t(platform ? 'auth.platform' : 'auth.tenant')
  const links = [
    { to: '/organizations', label: platform ? t('organizations.title') : t('organizations.current'), Icon: Building2 },
    { to: '/security', label: t('modules.securityConsole'), Icon: ShieldCheck },
    { to: '/styleguide', label: t('modules.styleguide'), Icon: Palette },
  ]
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose
  const MenuIcon = menuOpen ? X : Menu
  const columns = isCollapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[248px_minmax(0,1fr)]'

  return (
    <div className="min-h-dvh bg-canvas font-sans text-body [--app-nav-height:4.5rem]">
      <OverlayProvider>
        <a href="#app-main" onClick={() => setMenuOpen(false)} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-panel focus:p-4">{t('app.skipContent')}</a>
        <header className={`sticky top-0 z-30 flex h-(--app-nav-height) items-center justify-between border-0 border-b border-solid border-white/10 bg-navy text-white lg:grid ${columns}`}>
          <div className={`flex h-full min-w-0 items-center gap-2 pl-3 lg:border-0 lg:border-r lg:border-solid lg:border-white/10 ${isCollapsed ? 'lg:justify-center lg:px-0' : 'lg:px-6'}`}>
            <button ref={menuButton} type="button" aria-label={t(menuOpen ? 'app.closeNavigation' : 'app.openNavigation')} aria-expanded={menuOpen} aria-controls="app-sidebar" onClick={() => setMenuOpen((open) => !open)} className={`${headerControl} lg:hidden`}><MenuIcon size={20} aria-hidden="true" /></button>
            <NavLink to="/organizations" aria-label={t('app.name')} onClick={() => setMenuOpen(false)} className="inline-flex min-h-11 items-center gap-3 rounded-control text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-white"><img src="/assets/logo-simbolo.png" alt="" className="size-8 object-contain" /></span>
              <span className={`font-heading text-xl font-semibold ${isCollapsed ? 'lg:hidden' : ''}`}>SGEn</span>
            </NavLink>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3 px-3 sm:px-5 lg:justify-between">
            <div className="hidden min-w-0 items-center gap-4 lg:flex">
              <button type="button" aria-label={t(isCollapsed ? 'app.expandNavigation' : 'app.collapseNavigation')} aria-expanded={!isCollapsed} aria-controls="app-sidebar" onClick={() => setIsCollapsed((collapsed) => !collapsed)} className={headerControl}><CollapseIcon size={20} aria-hidden="true" /></button>
              <div className="min-w-0"><p className="m-0 text-xs text-white/65">{modeLabel}</p><p className="m-0 mt-1 truncate text-sm font-semibold">{session.context.organization?.legalName ?? t('app.title')}</p></div>
            </div>
            <UserMenu
              user={{ name: session.identity.name, email: session.identity.email, organization: session.context.organization?.legalName ?? modeLabel, role: modeLabel }}
              labels={{ menu: t('app.userMenu'), session: t('session.title'), organization: t('session.organization'), role: t('session.mode'), settings: t('session.title'), signOut: t(busy ? 'auth.signingOut' : 'auth.logout') }}
              onSettings={() => { void navigate('/session') }}
              onSignOut={() => { void logout() }}
              signingOut={busy}
            />
          </div>
        </header>
        <div className={`lg:grid ${columns}`}>
          {menuOpen && <button type="button" aria-label={t('app.closeNavigation')} onClick={() => setMenuOpen(false)} className="fixed inset-0 top-(--app-nav-height) z-10 cursor-pointer border-0 bg-navy/40 lg:hidden" />}
          <aside id="app-sidebar" className={`${menuOpen ? 'flex' : 'hidden'} fixed top-(--app-nav-height) left-0 z-20 h-[calc(100dvh-var(--app-nav-height))] w-[248px] max-w-[calc(100vw-48px)] flex-col border-0 border-r border-solid border-line bg-panel lg:sticky lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:self-start`}>
            <p className={`m-0 px-6 py-5 text-[10px] font-bold tracking-wider text-body uppercase ${isCollapsed ? 'lg:sr-only' : ''}`}>{t('app.securityAccess')}</p>
            <nav aria-label={t('app.name')} className={`min-h-0 overflow-y-auto px-3 pb-4 ${isCollapsed ? 'lg:pt-4' : ''}`}>
              <div className="grid gap-1">
                {links.map(({ to, label, Icon }) => (
                  <NavLink key={to} to={to} aria-label={label} title={label} onClick={() => setMenuOpen(false)} className={({ isActive }) => `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${isCollapsed ? 'lg:justify-center lg:gap-0' : ''} ${isActive ? 'bg-brand-soft font-semibold text-brand ring-1 ring-inset ring-brand/10' : 'font-medium text-body hover:bg-subtle hover:text-ink'}`}>
                    <Icon size={18} aria-hidden="true" className="shrink-0" />
                    <span className={`flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>{label}</span>
                    <ChevronRight size={14} aria-hidden="true" className={`shrink-0 opacity-50 ${isCollapsed ? 'lg:hidden' : ''}`} />
                  </NavLink>
                ))}
              </div>
            </nav>
          </aside>
          <main id="app-main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1400px] scroll-mt-24 px-5 py-8 focus:outline-none sm:px-8 sm:py-10 xl:px-12" key={`${session.context.accessMode}:${session.context.organization?.id ?? ''}`}>
            {error !== undefined && <div className="mb-6"><ErrorNotice error={error} /></div>}
            {session.password?.expiresSoon && !session.password.changeRequired && location.pathname !== '/password' && (
              <Notice variant="warning" className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <span>{t(session.password.daysRemaining === 0 ? 'password.expiresToday' : 'password.expiresSoon', { count: session.password.daysRemaining ?? 0 })}</span>
                <LinkButton to="/password" variant="secondary">{t('password.title')}</LinkButton>
              </Notice>
            )}
            <Outlet context={{ supportOpen, setSupportOpen }} />
          </main>
        </div>
      </OverlayProvider>
    </div>
  )
}

function SessionFallback({ state, onRetry }: Readonly<{ state: Exclude<SessionState, { status: 'authenticated' }>; onRetry: () => void }>) {
  const { t } = useTranslation()
  if (state.status === 'anonymous') return <Navigate to="/login" replace />
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16">
      <Card className="grid gap-4">
        {state.status === 'loading' ? <Spinner label={t('app.loading')} /> : <><ErrorNotice error={state.error} /><Button onClick={onRetry}>{t('app.retry')}</Button></>}
      </Card>
    </main>
  )
}
