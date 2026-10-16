import type { HttpClient } from '../../../shared/api/http-client'
import type { Envelope } from '../../../shared/api/response'
import type {
  CreatedInvitation,
  InvitationAcceptance,
  InvitationDetails,
  MfaChoice,
} from '../model/invitation'

export function createInvitationsApi(http: HttpClient) {
  return {
    async create(organizationId: string, input: { email: string; roles: string[] }) {
      return (
        await http.request<Envelope<CreatedInvitation>>(
          `/organizations/${encodeURIComponent(organizationId)}/invitations`,
          { method: 'POST', body: input },
        )
      ).data
    },
    async lookup(token: string, signal?: AbortSignal) {
      return (
        await http.request<Envelope<InvitationDetails>>('/invitations/lookup', {
          method: 'POST',
          authenticated: false,
          body: { token },
          signal,
        })
      ).data
    },
    async accept(input: {
      token: string
      fullName?: string
      password?: string
      mfa?: MfaChoice
    }) {
      return (
        await http.request<Envelope<InvitationAcceptance>>('/invitations/accept', {
          method: 'POST',
          authenticated: false,
          body: input,
        })
      ).data
    },
  }
}
