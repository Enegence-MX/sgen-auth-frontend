import { Building2, ChevronDown, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './DropdownMenu'

interface UserMenuProps {
  user: { name: string; email: string; organization: string; role: string }
  labels: { menu: string; session: string; organization: string; role: string; settings: string; signOut: string }
  onSettings: () => void
  onSignOut: () => void
  signingOut?: boolean
}

export function UserMenu({ user, labels, onSettings, onSignOut, signingOut = false }: Readonly<UserMenuProps>) {
  const names = user.name.trim().split(/\s+/u)
  const initials = [names[0]?.[0], names.length > 1 ? names.at(-1)?.[0] : names[0]?.[1]].join('').toLocaleUpperCase()
  return (
    <DropdownMenu align="end" className="w-80" trigger={
      <button type="button" aria-label={`${labels.menu}: ${user.name}`} className="group inline-flex min-h-12 max-w-60 shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-solid border-white/15 bg-white/5 p-1.5 pr-2.5 text-left font-sans text-white transition-colors hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-popup-open:border-white/30 data-popup-open:bg-white/15">
        <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white font-heading text-xs font-semibold text-navy">{initials}</span>
        <span className="hidden min-w-0 md:grid md:gap-0.5"><span className="truncate text-sm font-semibold">{user.name}</span><span className="truncate text-[11px] text-white/65">{user.role}</span></span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-white/65 transition-[rotate] duration-200 ease-out group-data-popup-open:rotate-180 motion-reduce:transition-none" />
      </button>
    }>
      <div className="p-3">
        <p className="mt-0 mb-4 text-[10px] font-bold tracking-wider text-muted uppercase">{labels.session}</p>
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-heading text-sm font-semibold text-brand ring-1 ring-inset ring-brand/10">{initials}</span>
          <div className="min-w-0"><p className="m-0 break-words font-heading text-sm font-semibold text-ink">{user.name}</p><p className="mt-1 mb-0 break-all text-xs text-body">{user.email}</p></div>
        </div>
        <dl className="mt-4 mb-0 grid gap-3 rounded-xl bg-subtle p-3">
          <div className="relative min-w-0 pl-6"><dt className="text-[10px] font-medium text-body"><Building2 size={16} aria-hidden="true" className="absolute top-0.5 left-0 text-muted" />{labels.organization}</dt><dd className="m-0 mt-1 break-words text-xs font-semibold text-ink">{user.organization}</dd></div>
          <div className="relative min-w-0 pl-6"><dt className="text-[10px] font-medium text-body"><ShieldCheck size={16} aria-hidden="true" className="absolute top-0.5 left-0 text-muted" />{labels.role}</dt><dd className="m-0 mt-1 break-words text-xs font-semibold text-ink">{user.role}</dd></div>
        </dl>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<Settings size={18} />} onClick={onSettings}>{labels.settings}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive disabled={signingOut} icon={<LogOut size={18} />} onClick={onSignOut}>{labels.signOut}</DropdownMenuItem>
    </DropdownMenu>
  )
}
