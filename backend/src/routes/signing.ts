import { Router, type Request, type Response } from 'express'
import { findSignerById, updateContract } from '../store.js'

const router = Router()

router.post('/:signerId/sign', (req: Request, res: Response) => {
  const { signatureImage } = req.body
  if (!signatureImage) {
    res.status(400).json({ error: '签名图片不能为空' })
    return
  }
  const result = findSignerById(req.params.signerId)
  if (!result) {
    res.status(404).json({ error: '签署人不存在' })
    return
  }
  const { contract, signer } = result
  if (!contract.signingFlow) {
    res.status(400).json({ error: '该合同无签署流程' })
    return
  }
  if (contract.status !== 'signing') {
    res.status(400).json({ error: '合同不在签署中状态' })
    return
  }
  if (signer.status !== 'pending') {
    res.status(400).json({ error: '该签署人无法签署' })
    return
  }
  if (contract.signingFlow.mode === 'sequential') {
    const currentStep = contract.signingFlow.currentStep ?? 0
    const signerIndex = contract.signingFlow.signers.findIndex(s => s.id === signer.id)
    if (signerIndex !== currentStep) {
      res.status(400).json({ error: '尚未轮到该签署人签署' })
      return
    }
  }

  const now = new Date().toISOString()
  const updatedSigners = contract.signingFlow.signers.map(s =>
    s.id === signer.id
      ? { ...s, status: 'signed' as const, signatureImage, signedAt: now }
      : s
  )

  const allSigned = updatedSigners.every(s => s.status === 'signed')
  let nextCurrentStep = contract.signingFlow.currentStep
  if (contract.signingFlow.mode === 'sequential' && !allSigned) {
    nextCurrentStep = (nextCurrentStep ?? 0) + 1
  }

  const updates: Record<string, any> = {
    signingFlow: {
      ...contract.signingFlow,
      signers: updatedSigners,
      currentStep: allSigned ? contract.signingFlow.signers.length - 1 : nextCurrentStep
    }
  }

  if (allSigned) {
    updates.status = 'signed'
    updates.signedAt = now
  }

  const updated = updateContract(contract.id, updates)
  res.json(updated)
})

router.post('/:signerId/reject', (req: Request, res: Response) => {
  const { reason } = req.body
  if (!reason) {
    res.status(400).json({ error: '拒签原因不能为空' })
    return
  }
  const result = findSignerById(req.params.signerId)
  if (!result) {
    res.status(404).json({ error: '签署人不存在' })
    return
  }
  const { contract, signer } = result
  if (!contract.signingFlow) {
    res.status(400).json({ error: '该合同无签署流程' })
    return
  }
  if (contract.status !== 'signing') {
    res.status(400).json({ error: '合同不在签署中状态' })
    return
  }
  if (signer.status !== 'pending') {
    res.status(400).json({ error: '该签署人无法操作' })
    return
  }

  const updatedSigners = contract.signingFlow.signers.map(s =>
    s.id === signer.id
      ? { ...s, status: 'rejected' as const, rejectedReason: reason }
      : s
  )

  const updated = updateContract(contract.id, {
    status: 'rejected',
    signingFlow: {
      ...contract.signingFlow,
      signers: updatedSigners
    }
  })
  res.json(updated)
})

router.get('/:signerId', (req: Request, res: Response) => {
  const result = findSignerById(req.params.signerId)
  if (!result) {
    res.status(404).json({ error: '签署人不存在' })
    return
  }
  res.json({
    signer: result.signer,
    contract: {
      id: result.contract.id,
      code: result.contract.code,
      title: result.contract.title,
      content: result.contract.content,
      status: result.contract.status,
      deadline: result.contract.deadline
    }
  })
})

export default router
