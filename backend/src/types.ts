export interface Contract {
  id: string
  code: string
  title: string
  content: string
  status: 'draft' | 'pending' | 'signing' | 'signed' | 'rejected' | 'expired'
  templateId?: string
  variables?: Record<string, string>
  signingFlow?: SigningFlow
  createdAt: string
  updatedAt: string
  deadline?: string
  signedAt?: string
}

export interface SigningFlow {
  id: string
  mode: 'sequential' | 'parallel'
  signers: Signer[]
  currentStep?: number
}

export interface Signer {
  id: string
  name: string
  email: string
  status: 'pending' | 'signed' | 'rejected' | 'expired'
  signatureImage?: string
  signedAt?: string
  rejectedReason?: string
  order: number
}

export interface Template {
  id: string
  name: string
  content: string
  variables: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  contractId: string
  type: 'expiring' | 'renewal' | 'follow_up'
  message: string
  sentAt: string
  read: boolean
}
