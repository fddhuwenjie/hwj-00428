import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getTemplates, getTemplateById, addTemplate, updateTemplate, deleteTemplate, incrementTemplateUsage, addContract } from '../store.js'
import type { Template, Contract } from '../types.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json(getTemplates())
})

router.get('/:id', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id)
  if (!template) {
    res.status(404).json({ error: '模板不存在' })
    return
  }
  res.json(template)
})

router.post('/', (req: Request, res: Response) => {
  const { name, content, variables } = req.body
  if (!name || !content) {
    res.status(400).json({ error: '模板名称和内容不能为空' })
    return
  }
  const now = new Date().toISOString()
  const template: Template = {
    id: uuidv4(),
    name,
    content,
    variables: variables || [],
    usageCount: 0,
    createdAt: now,
    updatedAt: now
  }
  addTemplate(template)
  res.status(201).json(template)
})

router.put('/:id', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id)
  if (!template) {
    res.status(404).json({ error: '模板不存在' })
    return
  }
  const { name, content, variables } = req.body
  const updated = updateTemplate(req.params.id, {
    ...(name !== undefined && { name }),
    ...(content !== undefined && { content }),
    ...(variables !== undefined && { variables })
  })
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  if (!getTemplateById(req.params.id)) {
    res.status(404).json({ error: '模板不存在' })
    return
  }
  deleteTemplate(req.params.id)
  res.json({ message: '删除成功' })
})

router.post('/:id/generate', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id)
  if (!template) {
    res.status(404).json({ error: '模板不存在' })
    return
  }
  const { title, variables, deadline } = req.body
  if (!title) {
    res.status(400).json({ error: '合同标题不能为空' })
    return
  }
  let content = template.content
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string)
    }
  }
  const now = new Date().toISOString()
  const datePart = (() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${dd}`
  })()
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  const contract: Contract = {
    id: uuidv4(),
    code: `CT-${datePart}-${seq}`,
    title,
    content,
    status: 'draft',
    templateId: template.id,
    variables,
    versions: [{
      id: uuidv4(),
      version: 'v1',
      content,
      title,
      modifiedAt: now,
      modifiedBy: '当前用户',
      summary: '初始版本（基于模板生成）'
    }],
    currentVersion: 'v1',
    createdAt: now,
    updatedAt: now,
    deadline
  }
  addContract(contract)
  incrementTemplateUsage(template.id)
  res.status(201).json(contract)
})

export default router
