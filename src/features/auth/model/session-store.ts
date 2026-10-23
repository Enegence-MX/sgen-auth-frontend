import { isUnauthorized } from '../../../shared/api/errors'
import type { AuthApi, SettingsChanges } from '../api/auth-api'
import type { Credentials } from './credentials'
import type { Session } from './session'
import type { MfaChallenge } from './mfa-challenge'

export type SessionState =
  | { status: 'loading'; session: null }
  | { status: 'anonymous'; session: null }
  | { status: 'error'; session: null; error: unknown }
  | { status: 'authenticated'; session: Session }

export class SessionStore {
  private state: SessionState = { status: 'loading', session: null }
  private readonly listeners = new Set<() => void>()
  private restoring?: Promise<void>
  private revision = 0
  private readonly api: AuthApi
  private broadcast: () => void

  constructor(api: AuthApi, broadcast: () => void = () => {}) {
    this.api = api
    this.broadcast = broadcast
  }
  setBroadcast(handler: () => void) {
    this.broadcast = handler
    return () => {
      this.broadcast = () => {}
    }
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private update(state: SessionState) {
    this.state = state
    for (const listener of this.listeners) listener()
  }
  expire = () => {
    this.revision++
    this.update({ status: 'anonymous', session: null })
  }

  restore = (): Promise<void> => {
    this.restoring ??= this.load().finally(() => {
      this.restoring = undefined
    })
    return this.restoring
  }
  private async load(): Promise<void> {
    const revision = this.revision
    try {
      const session = await this.api.profile()
      if (revision === this.revision) this.update({ status: 'authenticated', session })
    } catch (error) {
      if (revision !== this.revision) return
      this.update(
        isUnauthorized(error)
          ? { status: 'anonymous', session: null }
          : { status: 'error', session: null, error },
      )
    }
  }
  async login(credentials: Credentials, tenantId?: string): Promise<MfaChallenge | void> {
    this.revision++
    const revision = this.revision
    this.update({ status: 'anonymous', session: null })
    const result = await this.api.login(credentials, tenantId)
    if (result.status === 'mfa') return result.challenge
    const session = await this.api.profile()
    if (revision === this.revision) {
      this.update({ status: 'authenticated', session })
      this.broadcast()
    }
  }
  async verifyMfa(challengeToken: string, code: string): Promise<void> {
    this.revision++
    const revision = this.revision
    await this.api.verifyMfa(challengeToken, code)
    const session = await this.api.profile()
    if (revision === this.revision) {
      this.update({ status: 'authenticated', session })
      this.broadcast()
    }
  }
  async logout(): Promise<void> {
    try {
      await this.api.logout()
    } catch (error) {
      if (!isUnauthorized(error)) throw error
    }
    this.expire()
    this.broadcast()
  }
  passwordChanged(): void {
    this.expire()
    this.broadcast()
  }
  async refresh(): Promise<void> {
    await this.api.refresh()
    await this.restore()
  }
  async updateSettings(settings: SettingsChanges): Promise<void> {
    await this.api.updateSettings(settings)
    if (this.state.status === 'authenticated') {
      const updatedSession = {
        ...this.state.session,
        identity: { ...this.state.session.identity, ...settings },
      }
      this.update({ status: 'authenticated', session: updatedSession })
      this.broadcast()
    }
  }
  async externalChange(): Promise<void> {
    this.revision++
    this.update({ status: 'loading', session: null })
    if (this.restoring) await this.restoring
    await this.restore()
  }
}
