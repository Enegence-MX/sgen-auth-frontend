import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope } from '../../../shared/api/response'
import type { PasswordState } from '../model/password-policy'

export function createPasswordsApi(http: HttpClient) {
  return {
    async policy(signal?: AbortSignal) {
      return (await http.request<Envelope<PasswordState>>('/password/policy', { signal })).data
    },
    async change(currentPassword: string, newPassword: string) {
      await http.request('/password/change', { method: 'PUT', body: { currentPassword, newPassword } })
    },
  }
}
