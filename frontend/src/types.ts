export type ContractStatus = 'draft' | 'pending' | 'signing' | 'signed' | 'rejected' | 'expired'

export interface Contract {
  id: string
  code: string
  title: string
  content: string
  status: ContractStatus
  templateId?: string
  variables?: Record<string, string>
  signingFlow?: SigningFlow
  createdAt: string
  updatedAt: string
  deadline?: string
  signedAt?: string
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

export interface SigningFlow {
  id: string
  mode: 'sequential' | 'parallel'
  signers: Signer[]
  currentStep?: number
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

export interface DashboardStats {
  total: number
  byStatus: {
    draft: number
    pending: number
    signing: number
    signed: number
    rejected: number
    expired: number
  }
  completionRate: number
  avgSigningDuration: number
  expiringSoon: number
}

export interface TrendItem {
  month: string
  signed: number
  created: number
}

export interface TemplateRankingItem {
  id: string
  name: string
  usageCount: number
}
