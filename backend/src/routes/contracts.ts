import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getContracts, getContractById, getContractByCode, addContract, updateContract, deleteContract, addReminder } from '../store.js'
import type { Contract, Signer } from '../types.js'

const router = Router()

function generateCode(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const seq = String(getContracts().length + 1).padStart(4, '0')
  return `CT-${y}${m}${d}-${seq}`
}

router.get('/', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  let list = getContracts()
  if (status) {
    list = list.filter(c => c.status === status)
  }
  res.json(list)
})

router.get('/verify/:code', (req: Request, res: Response) => {
  const contract = getContractByCode(req.params.code)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  res.json(contract)
})

router.get('/:id', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  res.json(contract)
})

router.post('/', (req: Request, res: Response) => {
  const { title, content, templateId, variables, deadline } = req.body
  if (!title || !content) {
    res.status(400).json({ error: '标题和内容不能为空' })
    return
  }
  const now = new Date().toISOString()
  const contract: Contract = {
    id: uuidv4(),
    code: generateCode(),
    title,
    content,
    status: 'draft',
    templateId,
    variables,
    createdAt: now,
    updatedAt: now,
    deadline
  }
  addContract(contract)
  res.status(201).json(contract)
})

router.put('/:id', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  if (contract.status !== 'draft') {
    res.status(400).json({ error: '仅草稿状态可编辑' })
    return
  }
  const { title, content, templateId, variables, deadline } = req.body
  const updated = updateContract(req.params.id, {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(templateId !== undefined && { templateId }),
    ...(variables !== undefined && { variables }),
    ...(deadline !== undefined && { deadline })
  })
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  if (contract.status !== 'draft') {
    res.status(400).json({ error: '仅草稿状态可删除' })
    return
  }
  deleteContract(req.params.id)
  res.json({ message: '删除成功' })
})

router.post('/:id/signing', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  if (contract.status !== 'draft' && contract.status !== 'pending') {
    res.status(400).json({ error: '当前状态不可创建签署流程' })
    return
  }
  const { signers, mode }: { signers: { name: string; email: string }[]; mode: 'sequential' | 'parallel' } = req.body
  if (!signers || signers.length === 0) {
    res.status(400).json({ error: '签署人不能为空' })
    return
  }
  const flowSigners: Signer[] = signers.map((s, i) => ({
    id: uuidv4(),
    name: s.name,
    email: s.email,
    status: 'pending',
    order: i
  }))
  const signingFlow = {
    id: uuidv4(),
    mode,
    signers: flowSigners,
    currentStep: mode === 'sequential' ? 0 : undefined
  }
  const updated = updateContract(req.params.id, {
    signingFlow,
    status: 'signing'
  })
  res.json(updated)
})

router.get('/:id/signing', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  if (!contract.signingFlow) {
    res.status(404).json({ error: '该合同未创建签署流程' })
    return
  }
  res.json(contract.signingFlow)
})

router.post('/:id/remind', (req: Request, res: Response) => {
  const contract = getContractById(req.params.id)
  if (!contract) {
    res.status(404).json({ error: '合同不存在' })
    return
  }
  if (contract.status !== 'signing') {
    res.status(400).json({ error: '仅签署中的合同可催签' })
    return
  }
  const pendingSigners = contract.signingFlow!.signers.filter(s => s.status === 'pending')
  const messages = pendingSigners.map(s =>
    addReminder({
      id: uuidv4(),
      contractId: contract.id,
      type: 'follow_up',
      message: `请${s.name}(${s.email})尽快签署合同"${contract.title}"`,
      sentAt: new Date().toISOString(),
      read: false
    })
  )
  res.json(messages)
})

export default router
