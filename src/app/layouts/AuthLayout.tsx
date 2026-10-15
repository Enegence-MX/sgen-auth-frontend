import { Outlet, useLocation } from 'react-router'
import { AuthBrandPanel } from '../../features/auth/components/AuthBrandPanel'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/invitations/')) return <Outlet />

  return (
    <div className={styles.viewport}>
      <AuthBrandPanel />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
