export interface MfaChallenge {
  mfaRequired: true
  method: 'EMAIL'
  challengeToken: string
  sentTo: string
  expiresAt: string
}
