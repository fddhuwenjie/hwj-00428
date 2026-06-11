export interface ContractVersion {
  id: string
  version: string
  content: string
  title: string
  modifiedAt: string
  modifiedBy: string
  summary: string
}

export interface AuditLogEntry {
  id: string
  contractId: string
  timestamp: string
  operator: string
  action: 'create' | 'edit' | 'initiate_signing' | 'sign' | 'reject' | 'delegate' | 'remind' | 'export_pdf' | 'verify' | 'rollback' | 'batch_sign'
  details: string
  ip?: string
}

export interface Contract {
  id: string
  code: string
  title: string
  content: string
  status: 'draft' | 'pending' | 'signing' | 'signed' | 'rejected' | 'expired'
  templateId?: string
  variables?: Record<string, string>
  signingFlow?: SigningFlow
  versions: ContractVersion[]
  currentVersion: string
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

export interface DelegateInfo {
  originalSignerId: string
  originalSignerName: string
  originalSignerEmail: string
  delegateSignerId: string
  delegateSignerName: string
  delegateSignerEmail: string
  delegatedAt: string
}

export interface Signer {
  id: string
  name: string
  email: string
  status: 'pending' | 'signed' | 'rejected' | 'expired' | 'delegated' | 'signed_by_delegate'
  signatureImage?: string
  signedAt?: string
  rejectedReason?: string
  order: number
  delegateInfo?: DelegateInfo
  delegatedTo?: string
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
