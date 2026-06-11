import { Router, type Request, type Response } from 'express'
import { getReminders, getContracts, getReminderById, markReminderRead } from '../store.js'

const router = Router()

router.get('/expiring', (_req: Request, res: Response) => {
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const contracts = getContracts()
  const expiring = contracts.filter(c => {
    if (!c.deadline) return false
    const deadline = new Date(c.deadline)
    return deadline > now && deadline <= thirtyDaysLater && c.status !== 'signed'
  })
  res.json(expiring)
})

router.get('/', (_req: Request, res: Response) => {
  res.json(getReminders())
})

router.put('/:id/read', (req: Request, res: Response) => {
  const reminder = getReminderById(req.params.id)
  if (!reminder) {
    res.status(404).json({ error: '提醒不存在' })
    return
  }
  const updated = markReminderRead(req.params.id)
  res.json(updated)
})

export default router
