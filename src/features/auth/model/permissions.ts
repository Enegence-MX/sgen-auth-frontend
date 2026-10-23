import type { Session } from './session'

export function hasPermission(
  session: Session,
  code: string,
  module?: string,
): boolean {
  return session.permissions.some(
    (permission) => permission.code === code && (!module || permission.module === module),
  )
}
