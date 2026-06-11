import { Router, type Request, type Response } from 'express'
import { getContracts, getTemplates } from '../store.js'

const router = Router()

router.get('/dashboard', (_req: Request, res: Response) => {
  const contracts = getContracts()
  const total = contracts.length
  const byStatus = {
    draft: contracts.filter(c => c.status === 'draft').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    signing: contracts.filter(c => c.status === 'signing').length,
    signed: contracts.filter(c => c.status === 'signed').length,
    rejected: contracts.filter(c => c.status === 'rejected').length,
    expired: contracts.filter(c => c.status === 'expired').length
  }
  const completionRate = total > 0 ? (byStatus.signed / total * 100).toFixed(1) : '0'

  const signedContracts = contracts.filter(c => c.status === 'signed' && c.signedAt && c.createdAt)
  let avgSigningDuration = 0
  if (signedContracts.length > 0) {
    const totalDuration = signedContracts.reduce((acc, c) => {
      return acc + (new Date(c.signedAt!).getTime() - new Date(c.createdAt).getTime())
    }, 0)
    avgSigningDuration = Math.round(totalDuration / signedContracts.length / (1000 * 60 * 60 * 24))
  }

  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = contracts.filter(c => {
    if (!c.deadline) return false
    const deadline = new Date(c.deadline)
    return deadline > now && deadline <= thirtyDaysLater && c.status !== 'signed'
  }).length

  res.json({
    total,
    byStatus,
    completionRate: Number(completionRate),
    avgSigningDuration,
    expiringSoon
  })
})

router.get('/trend', (req: Request, res: Response) => {
  const contracts = getContracts()
  const months = req.query.months ? Number(req.query.months) : 6
  const now = new Date()
  const trend: { month: string; signed: number; created: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const created = contracts.filter(c => {
      const cd = new Date(c.createdAt)
      return cd.getFullYear() === year && cd.getMonth() === month
    }).length
    const signed = contracts.filter(c => {
      if (!c.signedAt) return false
      const sd = new Date(c.signedAt)
      return sd.getFullYear() === year && sd.getMonth() === month
    }).length
    trend.push({ month: monthStr, signed, created })
  }
  res.json(trend)
})

router.get('/template-ranking', (_req: Request, res: Response) => {
  const templates = getTemplates()
  const ranked = [...templates]
    .sort((a, b) => b.usageCount - a.usageCount)
    .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }))
  res.json(ranked)
})

export default router
