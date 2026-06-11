import { v4 as uuidv4 } from 'uuid'
import { getDb } from './db.js'
import type {
  Contract,
  Template,
  Reminder,
  ContractVersion,
  AuditLogEntry,
  Signer,
  SigningFlow,
  DelegateInfo
} from './types.js'

function parseJson<T>(value: string | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

function mapTemplate(row: any): Template {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    variables: parseJson<string[]>(row.variables, []),
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapContractVersion(row: any): ContractVersion {
  return {
    id: row.id,
    version: row.version,
    content: row.content,
    title: row.title,
    modifiedAt: row.modified_at,
    modifiedBy: row.modified_by,
    summary: row.summary
  }
}

function mapSigner(row: any): Signer {
  const signer: Signer = {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    order: row.order_index
  }
  if (row.signature_image) signer.signatureImage = row.signature_image
  if (row.signed_at) signer.signedAt = row.signed_at
  if (row.rejected_reason) signer.rejectedReason = row.rejected_reason
  if (row.delegate_info) signer.delegateInfo = parseJson<DelegateInfo>(row.delegate_info, undefined as any)
  if (row.delegated_to) signer.delegatedTo = row.delegated_to
  return signer
}

function getSigningFlow(contractId: string): SigningFlow | undefined {
  const db = getDb()
  const flowRow = db.prepare('SELECT * FROM signing_flows WHERE contract_id = ?').get(contractId) as any
  if (!flowRow) return undefined

  const signerRows = db.prepare('SELECT * FROM signers WHERE flow_id = ? ORDER BY order_index ASC').all(flowRow.id) as any[]
  const signers = signerRows.map(mapSigner)

  return {
    id: flowRow.id,
    mode: flowRow.mode,
    signers,
    currentStep: flowRow.current_step !== null ? flowRow.current_step : undefined
  }
}

function loadContractVersions(contractId: string): ContractVersion[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM contract_versions WHERE contract_id = ? ORDER BY modified_at ASC').all(contractId)
  return rows.map(mapContractVersion)
}

function mapContract(row: any): Contract {
  const versions = loadContractVersions(row.id)
  const signingFlow = getSigningFlow(row.id)
  const contract: Contract = {
    id: row.id,
    code: row.code,
    title: row.title,
    content: row.content,
    status: row.status,
    versions,
    currentVersion: row.current_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
  if (row.template_id) contract.templateId = row.template_id
  if (row.variables) contract.variables = parseJson<Record<string, string>>(row.variables, {})
  if (signingFlow) contract.signingFlow = signingFlow
  if (row.deadline) contract.deadline = row.deadline
  if (row.signed_at) contract.signedAt = row.signed_at
  return contract
}

function mapReminder(row: any): Reminder {
  return {
    id: row.id,
    contractId: row.contract_id,
    type: row.type,
    message: row.message,
    sentAt: row.sent_at,
    read: row.read === 1
  }
}

function mapAuditLog(row: any): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: row.id,
    contractId: row.contract_id,
    timestamp: row.timestamp,
    operator: row.operator,
    action: row.action,
    details: row.details
  }
  if (row.ip) entry.ip = row.ip
  return entry
}

export function getContracts(): Contract[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all()
  return rows.map(mapContract)
}

export function getContractById(id: string): Contract | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id)
  if (!row) return undefined
  return mapContract(row)
}

export function getContractByCode(code: string): Contract | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM contracts WHERE code = ?').get(code)
  if (!row) return undefined
  return mapContract(row)
}

export function addContract(contract: Contract): void {
  const db = getDb()
  const insertContract = db.prepare(`
    INSERT INTO contracts (id, code, title, content, status, template_id, variables, current_version, created_at, updated_at, deadline, signed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertContract.run(
    contract.id,
    contract.code,
    contract.title,
    contract.content,
    contract.status,
    contract.templateId || null,
    contract.variables ? JSON.stringify(contract.variables) : null,
    contract.currentVersion,
    contract.createdAt,
    contract.updatedAt,
    contract.deadline || null,
    contract.signedAt || null
  )

  const insertVersion = db.prepare(`
    INSERT INTO contract_versions (id, contract_id, version, content, title, modified_at, modified_by, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const version of contract.versions) {
    insertVersion.run(
      version.id,
      contract.id,
      version.version,
      version.content,
      version.title,
      version.modifiedAt,
      version.modifiedBy,
      version.summary
    )
  }

  if (contract.signingFlow) {
    const insertFlow = db.prepare(`
      INSERT INTO signing_flows (id, contract_id, mode, current_step)
      VALUES (?, ?, ?, ?)
    `)
    insertFlow.run(
      contract.signingFlow.id,
      contract.id,
      contract.signingFlow.mode,
      contract.signingFlow.currentStep !== undefined ? contract.signingFlow.currentStep : null
    )

    const insertSigner = db.prepare(`
      INSERT INTO signers (id, flow_id, name, email, status, signature_image, signed_at, rejected_reason, order_index, delegate_info, delegated_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const signer of contract.signingFlow.signers) {
      insertSigner.run(
        signer.id,
        contract.signingFlow.id,
        signer.name,
        signer.email,
        signer.status,
        signer.signatureImage || null,
        signer.signedAt || null,
        signer.rejectedReason || null,
        signer.order,
        signer.delegateInfo ? JSON.stringify(signer.delegateInfo) : null,
        signer.delegatedTo || null
      )
    }
  }
}

export function updateContract(id: string, updates: Partial<Contract>, operator: string = '当前用户'): Contract | undefined {
  const db = getDb()
  const oldContract = getContractById(id)
  if (!oldContract) return undefined

  const now = new Date().toISOString()
  let newVersions = [...oldContract.versions]
  let newCurrentVersion = oldContract.currentVersion

  if (updates.content !== undefined && updates.content !== oldContract.content) {
    const nextVersionNum = oldContract.versions.length + 1
    const newVersion: ContractVersion = {
      id: uuidv4(),
      version: `v${nextVersionNum}`,
      content: updates.content,
      title: updates.title || oldContract.title,
      modifiedAt: now,
      modifiedBy: operator,
      summary: `编辑合同内容${updates.title ? '和标题' : ''}`
    }
    newVersions.push(newVersion)
    newCurrentVersion = newVersion.version

    addAuditLog({
      id: uuidv4(),
      contractId: id,
      timestamp: now,
      operator,
      action: 'edit',
      details: `更新合同内容，生成新版本${newVersion.version}`,
      ip: '127.0.0.1'
    })

    const insertVersion = db.prepare(`
      INSERT INTO contract_versions (id, contract_id, version, content, title, modified_at, modified_by, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertVersion.run(
      newVersion.id,
      id,
      newVersion.version,
      newVersion.content,
      newVersion.title,
      newVersion.modifiedAt,
      newVersion.modifiedBy,
      newVersion.summary
    )
  }

  const fields: string[] = []
  const values: any[] = []

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.templateId !== undefined) { fields.push('template_id = ?'); values.push(updates.templateId || null) }
  if (updates.variables !== undefined) { fields.push('variables = ?'); values.push(JSON.stringify(updates.variables)) }
  if (updates.currentVersion !== undefined) { fields.push('current_version = ?'); values.push(updates.currentVersion) }
  if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline || null) }
  if (updates.signedAt !== undefined) { fields.push('signed_at = ?'); values.push(updates.signedAt || null) }

  if (updates.content !== undefined) {
    fields.push('current_version = ?')
    values.push(newCurrentVersion)
  }

  fields.push('updated_at = ?')
  values.push(now)
  values.push(id)

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)
  }

  if (updates.signingFlow) {
    const existingFlow = db.prepare('SELECT id FROM signing_flows WHERE contract_id = ?').get(id) as any
    if (existingFlow) {
      db.prepare('DELETE FROM signers WHERE flow_id = ?').run(existingFlow.id)
      db.prepare('DELETE FROM signing_flows WHERE id = ?').run(existingFlow.id)
    }

    db.prepare(`
      INSERT INTO signing_flows (id, contract_id, mode, current_step)
      VALUES (?, ?, ?, ?)
    `).run(
      updates.signingFlow.id,
      id,
      updates.signingFlow.mode,
      updates.signingFlow.currentStep !== undefined ? updates.signingFlow.currentStep : null
    )

    const insertSigner = db.prepare(`
      INSERT INTO signers (id, flow_id, name, email, status, signature_image, signed_at, rejected_reason, order_index, delegate_info, delegated_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const signer of updates.signingFlow.signers) {
      insertSigner.run(
        signer.id,
        updates.signingFlow.id,
        signer.name,
        signer.email,
        signer.status,
        signer.signatureImage || null,
        signer.signedAt || null,
        signer.rejectedReason || null,
        signer.order,
        signer.delegateInfo ? JSON.stringify(signer.delegateInfo) : null,
        signer.delegatedTo || null
      )
    }
  }

  return getContractById(id)
}

export function deleteContract(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(id)
  return result.changes > 0
}

export function getContractVersions(contractId: string): ContractVersion[] | undefined {
  const contract = getContractById(contractId)
  if (!contract) return undefined
  return [...contract.versions].sort((a, b) =>
    new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  )
}

export function getContractVersion(contractId: string, version: string): ContractVersion | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM contract_versions WHERE contract_id = ? AND version = ?').get(contractId, version)
  if (!row) return undefined
  return mapContractVersion(row)
}

export function rollbackToVersion(contractId: string, version: string, operator: string = '当前用户'): Contract | undefined {
  const contract = getContractById(contractId)
  if (!contract) return undefined

  if (contract.status === 'signing' || contract.status === 'signed') {
    return undefined
  }

  const targetVersion = contract.versions.find(v => v.version === version)
  if (!targetVersion) return undefined

  const now = new Date().toISOString()
  const newVersionNum = contract.versions.length + 1
  const newVersion: ContractVersion = {
    id: uuidv4(),
    version: `v${newVersionNum}`,
    content: targetVersion.content,
    title: targetVersion.title,
    modifiedAt: now,
    modifiedBy: operator,
    summary: `回滚到版本${version}`
  }

  const db = getDb()
  db.prepare(`
    INSERT INTO contract_versions (id, contract_id, version, content, title, modified_at, modified_by, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newVersion.id,
    contractId,
    newVersion.version,
    newVersion.content,
    newVersion.title,
    newVersion.modifiedAt,
    newVersion.modifiedBy,
    newVersion.summary
  )

  db.prepare('UPDATE contracts SET content = ?, title = ?, current_version = ?, updated_at = ? WHERE id = ?').run(
    targetVersion.content,
    targetVersion.title,
    newVersion.version,
    now,
    contractId
  )

  addAuditLog({
    id: uuidv4(),
    contractId,
    timestamp: now,
    operator,
    action: 'rollback',
    details: `回滚合同到版本${version}，生成新版本${newVersion.version}`,
    ip: '127.0.0.1'
  })

  return getContractById(contractId)
}

export function getAuditLogs(contractId: string): AuditLogEntry[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM audit_logs WHERE contract_id = ? ORDER BY timestamp DESC').all(contractId)
  return rows.map(mapAuditLog)
}

export function addAuditLog(log: AuditLogEntry): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO audit_logs (id, contract_id, timestamp, operator, action, details, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id,
    log.contractId,
    log.timestamp,
    log.operator,
    log.action,
    log.details,
    log.ip || null
  )
}

export function batchCreateSigning(
  contractIds: string[],
  signers: { name: string; email: string }[],
  mode: 'sequential' | 'parallel',
  operator: string = '当前用户'
): { success: string[]; failed: { id: string; reason: string }[] } {
  const success: string[] = []
  const failed: { id: string; reason: string }[] = []

  const db = getDb()

  for (const id of contractIds) {
    const contract = getContractById(id)
    if (!contract) {
      failed.push({ id, reason: '合同不存在' })
      continue
    }
    if (contract.status !== 'draft' && contract.status !== 'pending') {
      failed.push({ id, reason: `当前状态(${contract.status})不可创建签署流程` })
      continue
    }

    const flowSigners: Signer[] = signers.map((s, i) => ({
      id: uuidv4(),
      name: s.name,
      email: s.email,
      status: 'pending',
      order: i
    }))

    const flowId = uuidv4()
    const signingFlow: SigningFlow = {
      id: flowId,
      mode,
      signers: flowSigners,
      currentStep: mode === 'sequential' ? 0 : undefined
    }

    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO signing_flows (id, contract_id, mode, current_step)
      VALUES (?, ?, ?, ?)
    `).run(
      flowId,
      id,
      mode,
      mode === 'sequential' ? 0 : null
    )

    const insertSigner = db.prepare(`
      INSERT INTO signers (id, flow_id, name, email, status, signature_image, signed_at, rejected_reason, order_index, delegate_info, delegated_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const signer of flowSigners) {
      insertSigner.run(
        signer.id,
        flowId,
        signer.name,
        signer.email,
        signer.status,
        null,
        null,
        null,
        signer.order,
        null,
        null
      )
    }

    db.prepare('UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?').run('signing', now, id)

    addAuditLog({
      id: uuidv4(),
      contractId: id,
      timestamp: now,
      operator,
      action: 'batch_sign',
      details: `批量发起签署流程，${mode === 'sequential' ? '顺序签' : '同时签'}模式，共${signers.length}位签署人`,
      ip: '127.0.0.1'
    })

    success.push(id)
  }

  return { success, failed }
}

export function delegateSigning(
  signerId: string,
  delegateName: string,
  delegateEmail: string,
  operator: string = '当前用户'
): { contract: Contract; newSignerId: string } | undefined {
  const result = findSignerById(signerId)
  if (!result) return undefined

  const { contract, signer } = result

  if (contract.status !== 'signing') return undefined
  if (signer.status !== 'pending') return undefined
  if (signer.delegateInfo) return undefined

  const now = new Date().toISOString()
  const newSignerId = uuidv4()

  const delegateInfo: DelegateInfo = {
    originalSignerId: signer.id,
    originalSignerName: signer.name,
    originalSignerEmail: signer.email,
    delegateSignerId: newSignerId,
    delegateSignerName: delegateName,
    delegateSignerEmail: delegateEmail,
    delegatedAt: now
  }

  const db = getDb()
  const flowId = contract.signingFlow!.id

  db.prepare(`
    UPDATE signers
    SET status = 'delegated', delegated_to = ?, delegate_info = ?
    WHERE id = ?
  `).run(newSignerId, JSON.stringify(delegateInfo), signer.id)

  db.prepare(`
    INSERT INTO signers (id, flow_id, name, email, status, signature_image, signed_at, rejected_reason, order_index, delegate_info, delegated_to)
    VALUES (?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?, NULL)
  `).run(newSignerId, flowId, delegateName, delegateEmail, signer.order, JSON.stringify(delegateInfo))

  db.prepare('UPDATE contracts SET updated_at = ? WHERE id = ?').run(now, contract.id)

  addAuditLog({
    id: uuidv4(),
    contractId: contract.id,
    timestamp: now,
    operator,
    action: 'delegate',
    details: `${signer.name}委托${delegateName}(${delegateEmail})代为签署`,
    ip: '127.0.0.1'
  })

  const updatedContract = getContractById(contract.id)!
  return { contract: updatedContract, newSignerId }
}

export function completeDelegateSigning(
  delegateSignerId: string,
  signatureImage: string
): Contract | undefined {
  const result = findSignerById(delegateSignerId)
  if (!result) return undefined

  const { contract, signer } = result

  if (!signer.delegateInfo) return undefined
  if (signer.status !== 'pending') return undefined

  const now = new Date().toISOString()
  const db = getDb()

  db.prepare(`
    UPDATE signers
    SET status = 'signed_by_delegate', signature_image = ?, signed_at = ?
    WHERE id = ?
  `).run(signatureImage, now, delegateSignerId)

  db.prepare(`
    UPDATE signers
    SET status = 'signed_by_delegate', signature_image = ?, signed_at = ?
    WHERE id = ?
  `).run(signatureImage, now, signer.delegateInfo!.originalSignerId)

  const updatedContract = getContractById(contract.id)!
  const signers = updatedContract.signingFlow!.signers

  const allSigned = signers.filter(s => !s.delegateInfo || s.id === delegateSignerId).every(s =>
    s.status === 'signed' || s.status === 'signed_by_delegate'
  )

  let nextCurrentStep = updatedContract.signingFlow!.currentStep
  if (updatedContract.signingFlow!.mode === 'sequential' && !allSigned) {
    nextCurrentStep = (nextCurrentStep ?? 0) + 1
  }

  if (allSigned) {
    db.prepare('UPDATE contracts SET status = ?, signed_at = ?, updated_at = ? WHERE id = ?').run(
      'signed', now, now, contract.id
    )
  } else {
    db.prepare('UPDATE contracts SET updated_at = ? WHERE id = ?').run(now, contract.id)
  }

  if (updatedContract.signingFlow!.mode === 'sequential') {
    db.prepare('UPDATE signing_flows SET current_step = ? WHERE id = ?').run(
      allSigned ? signers.length - 1 : nextCurrentStep,
      updatedContract.signingFlow!.id
    )
  }

  addAuditLog({
    id: uuidv4(),
    contractId: contract.id,
    timestamp: now,
    operator: signer.name,
    action: 'sign',
    details: `${signer.delegateInfo!.delegateSignerName}代${signer.delegateInfo!.originalSignerName}完成签署`,
    ip: '127.0.0.1'
  })

  return getContractById(contract.id)
}

export function getTemplates(): Template[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all()
  return rows.map(mapTemplate)
}

export function getTemplateById(id: string): Template | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id)
  if (!row) return undefined
  return mapTemplate(row)
}

export function addTemplate(template: Template): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO templates (id, name, content, variables, usage_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    template.id,
    template.name,
    template.content,
    JSON.stringify(template.variables),
    template.usageCount,
    template.createdAt,
    template.updatedAt
  )
}

export function updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
  const db = getDb()
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content) }
  if (updates.variables !== undefined) { fields.push('variables = ?'); values.push(JSON.stringify(updates.variables)) }
  if (updates.usageCount !== undefined) { fields.push('usage_count = ?'); values.push(updates.usageCount) }

  if (fields.length > 0) {
    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)
    db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }

  return getTemplateById(id)
}

export function deleteTemplate(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id)
  return result.changes > 0
}

export function incrementTemplateUsage(id: string): void {
  const db = getDb()
  db.prepare('UPDATE templates SET usage_count = usage_count + 1, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(), id
  )
}

export function getReminders(): Reminder[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM reminders ORDER BY sent_at DESC').all()
  return rows.map(mapReminder)
}

export function getReminderById(id: string): Reminder | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id)
  if (!row) return undefined
  return mapReminder(row)
}

export function addReminder(reminder: Reminder): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO reminders (id, contract_id, type, message, sent_at, read)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    reminder.id,
    reminder.contractId,
    reminder.type,
    reminder.message,
    reminder.sentAt,
    reminder.read ? 1 : 0
  )
}

export function markReminderRead(id: string): Reminder | undefined {
  const db = getDb()
  db.prepare('UPDATE reminders SET read = 1 WHERE id = ?').run(id)
  return getReminderById(id)
}

export function findSignerById(signerId: string): { contract: Contract; signer: Signer } | undefined {
  const db = getDb()
  const row = db.prepare(`
    SELECT s.*, sf.contract_id
    FROM signers s
    JOIN signing_flows sf ON s.flow_id = sf.id
    WHERE s.id = ?
  `).get(signerId) as any

  if (!row) return undefined

  const contract = getContractById(row.contract_id)
  if (!contract) return undefined

  const signer = contract.signingFlow?.signers.find(s => s.id === signerId)
  if (!signer) return undefined

  return { contract, signer }
}

export function getContractCount(): number {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM contracts').get() as any
  return row.count
}
