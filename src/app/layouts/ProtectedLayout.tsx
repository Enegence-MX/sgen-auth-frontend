import { useState, useEffect } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useServices, useSession } from '../services/services-context'
import { ErrorNotice } from '../../shared/ui/ErrorNotice'
import { Button } from '../../shared/ui/Button'
import { Avatar } from '../../shared/ui/Avatar'
import { Building2, User, LogOut, Menu, Palette, ShieldCheck } from 'lucide-react'
import styles from './ProtectedLayout.module.css'

export function ProtectedLayout() {
  const { t, i18n } = useTranslation()
  const { auth } = useServices()
  const state = useSession()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const preferredLanguage = state.status === 'authenticated' ? state.session.identity.language : undefined
  const preferredTheme = state.status === 'authenticated' ? state.session.identity.theme : undefined

  useEffect(() => {
    if (preferredLanguage && i18n.resolvedLanguage !== preferredLanguage) {
      void i18n.changeLanguage(preferredLanguage)
    }
    if (preferredTheme) {
      if (preferredTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [preferredLanguage, preferredTheme, i18n])

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

  if (state.status === 'anonymous') return <Navigate to="/login" replace />
  if (state.status === 'loading')
    return (
      <main className={styles.mainWrapper}>
        <div className={styles.main}>
          <p role="status">{t('app.loading')}</p>
        </div>
      </main>
    )

  if (state.status === 'error')
    return (
      <main className={styles.mainWrapper}>
        <div className={styles.main}>
          <ErrorNotice error={state.error} />
          <Button onClick={() => void auth.restore()}>{t('app.retry')}</Button>
        </div>
      </main>
    )

  const { session } = state
  const platform = session.context.accessMode === 'PLATFORM_SUPERADMIN'

  return (
    <div className={styles.shell}>
      <aside className={styles.header} data-collapsed={isCollapsed}>
        <NavLink to="/organizations" className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src="/assets/logo-simbolo.png" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div className={styles.brandText}>
            <strong>SGEn</strong>
            <span>{t('app.name') || 'ENEGENCE'}</span>
          </div>
        </NavLink>

        <div className={styles.navCategory}>Seguridad y Acceso</div>
        <nav aria-label={t('app.name')}>
          <NavLink to="/organizations">
            <Building2 size={20} />
            <span>{platform ? t('organizations.title') : t('organizations.current')}</span>
          </NavLink>
          <NavLink to="/security">
            <ShieldCheck size={20} />
            <span>{t('modules.securityConsole')}</span>
          </NavLink>
          <NavLink to="/styleguide">
            <Palette size={20} />
            <span>{t('modules.styleguide')}</span>
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <div className={styles.userMenuWrapper}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={styles.userBtn}
              aria-expanded={userMenuOpen}
            >
              <div className={styles.avatar}>
                <Avatar name={session.identity.name} size={28} />
              </div>
              <span>{session.identity.name}</span>
            </button>
            {userMenuOpen && (
              <div className={styles.userDropdown}>
                <NavLink to="/session" onClick={() => setUserMenuOpen(false)}>
                  <User size={16} />
                  {t('session.title')}
                </NavLink>
                <button onClick={() => { setUserMenuOpen(false); void logout(); }} disabled={busy}>
                  <LogOut size={16} />
                  {busy ? t('auth.signingOut') : t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.identityWrapper}>
            <button className={styles.toggleBtn} onClick={() => setIsCollapsed(!isCollapsed)} aria-label="Toggle sidebar">
              <Menu size={24} />
            </button>
            <div className={styles.identity}>
              <span>{platform ? t('auth.platform') : t('auth.tenant')}</span>
              <span>{session.identity.name}</span>
            </div>
          </div>
          <div className={styles.topActions}>
            {location.pathname === '/security' && (
              <button className={styles.badgeBtn} type="button" onClick={() => setSupportOpen(true)}>
                {t('securityConsole.supportContext')}
              </button>
            )}
          </div>
        </header>

        <main
          className={styles.main}
          key={`${session.context.accessMode}:${session.context.organization?.id ?? ''}`}
        >
          {error !== undefined && <ErrorNotice error={error} />}
          <Outlet context={{ supportOpen, setSupportOpen }} />
        </main>
      </div>
    </div>
  )
}
