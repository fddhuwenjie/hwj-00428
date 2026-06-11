import { v4 as uuidv4 } from 'uuid'
import type { Contract, Template, Reminder } from './types.js'

const templates: Template[] = [
  {
    id: uuidv4(),
    name: '劳动合同',
    content: '甲方：{{甲方名称}}\n乙方：{{乙方姓名}}\n\n根据《中华人民共和国劳动法》，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。\n\n一、职位：{{职位}}\n二、月薪：{{月薪}}元\n三、入职日期：{{入职日期}}\n四、合同期限：{{合同期限}}\n\n本合同一式两份，甲乙双方各执一份，自签订之日起生效。',
    variables: ['甲方名称', '乙方姓名', '职位', '月薪', '入职日期', '合同期限'],
    usageCount: 5,
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-01-15T08:00:00.000Z'
  },
  {
    id: uuidv4(),
    name: '保密协议',
    content: '甲方：{{甲方名称}}\n乙方：{{乙方姓名}}\n\n为保护甲方的商业秘密和知识产权，双方就保密事宜达成如下协议：\n\n一、保密期限：{{保密期限}}\n二、生效日期：{{生效日期}}\n\n乙方在保密期限内不得向任何第三方披露甲方的商业秘密。违反本协议的，应承担相应的法律责任。',
    variables: ['甲方名称', '乙方姓名', '保密期限', '生效日期'],
    usageCount: 3,
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-01T08:00:00.000Z'
  },
  {
    id: uuidv4(),
    name: '服务合同',
    content: '甲方：{{甲方名称}}\n乙方：{{乙方名称}}\n\n甲乙双方就以下服务事宜达成如下协议：\n\n一、服务内容：{{服务内容}}\n二、服务费用：{{服务费用}}元\n三、生效日期：{{生效日期}}\n四、截止日期：{{截止日期}}\n\n甲方应按约定支付服务费用，乙方应按约定提供服务质量。',
    variables: ['甲方名称', '乙方名称', '服务内容', '服务费用', '生效日期', '截止日期'],
    usageCount: 2,
    createdAt: '2025-03-01T08:00:00.000Z',
    updatedAt: '2025-03-01T08:00:00.000Z'
  }
]

const signerId1 = uuidv4()
const signerId2 = uuidv4()
const signerId3 = uuidv4()
const signerId4 = uuidv4()
const signerId5 = uuidv4()
const signerId6 = uuidv4()
const signerId7 = uuidv4()
const signerId8 = uuidv4()
const signerId9 = uuidv4()
const signerId10 = uuidv4()

const contracts: Contract[] = [
  {
    id: uuidv4(),
    code: 'CT-20250115-0001',
    title: '张三劳动合同',
    content: '甲方：北京科技有限公司\n乙方：张三\n\n根据《中华人民共和国劳动法》，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。\n\n一、职位：前端工程师\n二、月薪：15000元\n三、入职日期：2025-02-01\n四、合同期限：三年\n\n本合同一式两份，甲乙双方各执一份，自签订之日起生效。',
    status: 'draft',
    templateId: templates[0].id,
    variables: { '甲方名称': '北京科技有限公司', '乙方姓名': '张三', '职位': '前端工程师', '月薪': '15000', '入职日期': '2025-02-01', '合同期限': '三年' },
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
    deadline: '2025-07-01T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250210-0002',
    title: '李四劳动合同',
    content: '甲方：上海创新科技\n乙方：李四\n\n根据《中华人民共和国劳动法》，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。\n\n一、职位：产品经理\n二、月薪：20000元\n三、入职日期：2025-03-01\n四、合同期限：两年\n\n本合同一式两份，甲乙双方各执一份，自签订之日起生效。',
    status: 'draft',
    templateId: templates[0].id,
    variables: { '甲方名称': '上海创新科技', '乙方姓名': '李四', '职位': '产品经理', '月薪': '20000', '入职日期': '2025-03-01', '合同期限': '两年' },
    createdAt: '2025-06-02T08:00:00.000Z',
    updatedAt: '2025-06-02T08:00:00.000Z',
    deadline: '2025-07-15T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250305-0003',
    title: '王五保密协议',
    content: '甲方：深圳数据科技\n乙方：王五\n\n为保护甲方的商业秘密和知识产权，双方就保密事宜达成如下协议：\n\n一、保密期限：两年\n二、生效日期：2025-04-01\n\n乙方在保密期限内不得向任何第三方披露甲方的商业秘密。违反本协议的，应承担相应的法律责任。',
    status: 'pending',
    templateId: templates[1].id,
    variables: { '甲方名称': '深圳数据科技', '乙方姓名': '王五', '保密期限': '两年', '生效日期': '2025-04-01' },
    createdAt: '2025-05-20T08:00:00.000Z',
    updatedAt: '2025-05-20T08:00:00.000Z',
    deadline: '2025-06-30T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250412-0004',
    title: '赵六保密协议',
    content: '甲方：广州信息科技\n乙方：赵六\n\n为保护甲方的商业秘密和知识产权，双方就保密事宜达成如下协议：\n\n一、保密期限：三年\n二、生效日期：2025-05-01\n\n乙方在保密期限内不得向任何第三方披露甲方的商业秘密。违反本协议的，应承担相应的法律责任。',
    status: 'pending',
    templateId: templates[1].id,
    variables: { '甲方名称': '广州信息科技', '乙方姓名': '赵六', '保密期限': '三年', '生效日期': '2025-05-01' },
    createdAt: '2025-05-25T08:00:00.000Z',
    updatedAt: '2025-05-25T08:00:00.000Z',
    deadline: '2025-07-31T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250501-0005',
    title: '陈七劳动合同',
    content: '甲方：杭州互联网科技\n乙方：陈七\n\n根据《中华人民共和国劳动法》，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。\n\n一、职位：后端工程师\n二、月薪：18000元\n三、入职日期：2025-06-01\n四、合同期限：三年\n\n本合同一式两份，甲乙双方各执一份，自签订之日起生效。',
    status: 'signing',
    templateId: templates[0].id,
    variables: { '甲方名称': '杭州互联网科技', '乙方姓名': '陈七', '职位': '后端工程师', '月薪': '18000', '入职日期': '2025-06-01', '合同期限': '三年' },
    signingFlow: {
      id: uuidv4(),
      mode: 'sequential',
      currentStep: 1,
      signers: [
        { id: signerId1, name: '陈七', email: 'chen7@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-05-28T10:30:00.000Z', order: 0 },
        { id: signerId2, name: 'HR李经理', email: 'hr@example.com', status: 'pending', order: 1 },
        { id: signerId3, name: '总经理', email: 'ceo@example.com', status: 'pending', order: 2 }
      ]
    },
    createdAt: '2025-05-15T08:00:00.000Z',
    updatedAt: '2025-05-28T10:30:00.000Z',
    deadline: '2025-06-30T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250510-0006',
    title: '周八服务合同',
    content: '甲方：成都咨询公司\n乙方：周八设计工作室\n\n甲乙双方就以下服务事宜达成如下协议：\n\n一、服务内容：品牌视觉设计\n二、服务费用：50000元\n三、生效日期：2025-06-01\n四、截止日期：2025-08-31\n\n甲方应按约定支付服务费用，乙方应按约定提供服务质量。',
    status: 'signing',
    templateId: templates[2].id,
    variables: { '甲方名称': '成都咨询公司', '乙方名称': '周八设计工作室', '服务内容': '品牌视觉设计', '服务费用': '50000', '生效日期': '2025-06-01', '截止日期': '2025-08-31' },
    signingFlow: {
      id: uuidv4(),
      mode: 'parallel',
      signers: [
        { id: signerId4, name: '周八', email: 'zhou8@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-05-25T14:00:00.000Z', order: 0 },
        { id: signerId5, name: '甲方代表', email: 'client@example.com', status: 'pending', order: 1 }
      ]
    },
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: '2025-05-25T14:00:00.000Z',
    deadline: '2025-07-01T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250401-0007',
    title: '吴九劳动合同',
    content: '甲方：南京软件科技\n乙方：吴九\n\n根据《中华人民共和国劳动法》，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。\n\n一、职位：测试工程师\n二、月薪：12000元\n三、入职日期：2025-04-15\n四、合同期限：两年\n\n本合同一式两份，甲乙双方各执一份，自签订之日起生效。',
    status: 'signed',
    templateId: templates[0].id,
    variables: { '甲方名称': '南京软件科技', '乙方姓名': '吴九', '职位': '测试工程师', '月薪': '12000', '入职日期': '2025-04-15', '合同期限': '两年' },
    signingFlow: {
      id: uuidv4(),
      mode: 'sequential',
      currentStep: 2,
      signers: [
        { id: signerId6, name: '吴九', email: 'wu9@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-04-10T09:00:00.000Z', order: 0 },
        { id: signerId7, name: 'HR王经理', email: 'hr2@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-04-10T15:30:00.000Z', order: 1 }
      ]
    },
    createdAt: '2025-04-01T08:00:00.000Z',
    updatedAt: '2025-04-10T15:30:00.000Z',
    signedAt: '2025-04-10T15:30:00.000Z',
    deadline: '2025-05-01T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250320-0008',
    title: '郑十服务合同',
    content: '甲方：武汉教育科技\n乙方：郑十培训中心\n\n甲乙双方就以下服务事宜达成如下协议：\n\n一、服务内容：企业培训服务\n二、服务费用：80000元\n三、生效日期：2025-04-01\n四、截止日期：2025-06-30\n\n甲方应按约定支付服务费用，乙方应按约定提供服务质量。',
    status: 'signed',
    templateId: templates[2].id,
    variables: { '甲方名称': '武汉教育科技', '乙方名称': '郑十培训中心', '服务内容': '企业培训服务', '服务费用': '80000', '生效日期': '2025-04-01', '截止日期': '2025-06-30' },
    signingFlow: {
      id: uuidv4(),
      mode: 'parallel',
      signers: [
        { id: signerId8, name: '郑十', email: 'zheng10@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-03-28T11:00:00.000Z', order: 0 },
        { id: signerId9, name: '甲方代表刘总', email: 'liuzong@example.com', status: 'signed', signatureImage: 'data:image/png;base64,iVBOR...,', signedAt: '2025-03-29T16:00:00.000Z', order: 1 }
      ]
    },
    createdAt: '2025-03-20T08:00:00.000Z',
    updatedAt: '2025-03-29T16:00:00.000Z',
    signedAt: '2025-03-29T16:00:00.000Z',
    deadline: '2025-04-15T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250415-0009',
    title: '孙十一保密协议',
    content: '甲方：重庆智能制造\n乙方：孙十一\n\n为保护甲方的商业秘密和知识产权，双方就保密事宜达成如下协议：\n\n一、保密期限：五年\n二、生效日期：2025-05-01\n\n乙方在保密期限内不得向任何第三方披露甲方的商业秘密。违反本协议的，应承担相应的法律责任。',
    status: 'rejected',
    templateId: templates[1].id,
    variables: { '甲方名称': '重庆智能制造', '乙方姓名': '孙十一', '保密期限': '五年', '生效日期': '2025-05-01' },
    signingFlow: {
      id: uuidv4(),
      mode: 'sequential',
      signers: [
        { id: signerId10, name: '孙十一', email: 'sun11@example.com', status: 'rejected', rejectedReason: '保密条款过于严格，无法接受', order: 0 }
      ]
    },
    createdAt: '2025-04-15T08:00:00.000Z',
    updatedAt: '2025-04-20T09:00:00.000Z',
    deadline: '2025-05-15T23:59:59.000Z'
  },
  {
    id: uuidv4(),
    code: 'CT-20250201-0010',
    title: '钱十二服务合同',
    content: '甲方：西安物流有限公司\n乙方：钱十二运输公司\n\n甲乙双方就以下服务事宜达成如下协议：\n\n一、服务内容：物流配送服务\n二、服务费用：120000元\n三、生效日期：2025-02-15\n四、截止日期：2025-04-15\n\n甲方应按约定支付服务费用，乙方应按约定提供服务质量。',
    status: 'expired',
    templateId: templates[2].id,
    variables: { '甲方名称': '西安物流有限公司', '乙方名称': '钱十二运输公司', '服务内容': '物流配送服务', '服务费用': '120000', '生效日期': '2025-02-15', '截止日期': '2025-04-15' },
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-01T08:00:00.000Z',
    deadline: '2025-03-01T23:59:59.000Z'
  }
]

const reminders: Reminder[] = [
  {
    id: uuidv4(),
    contractId: contracts[2].id,
    type: 'expiring',
    message: '合同"王五保密协议"将于2025-06-30到期，请及时处理',
    sentAt: '2025-06-15T09:00:00.000Z',
    read: false
  },
  {
    id: uuidv4(),
    contractId: contracts[3].id,
    type: 'expiring',
    message: '合同"赵六保密协议"将于2025-07-31到期，请及时处理',
    sentAt: '2025-06-20T09:00:00.000Z',
    read: false
  },
  {
    id: uuidv4(),
    contractId: contracts[4].id,
    type: 'follow_up',
    message: '合同"陈七劳动合同"正在签署中，HR李经理尚未签署',
    sentAt: '2025-06-01T09:00:00.000Z',
    read: true
  },
  {
    id: uuidv4(),
    contractId: contracts[0].id,
    type: 'renewal',
    message: '合同"张三劳动合同"为草稿状态，请尽快发起签署流程',
    sentAt: '2025-06-10T09:00:00.000Z',
    read: false
  },
  {
    id: uuidv4(),
    contractId: contracts[5].id,
    type: 'follow_up',
    message: '合同"周八服务合同"正在签署中，甲方代表尚未签署',
    sentAt: '2025-06-05T09:00:00.000Z',
    read: false
  }
]

export function getContracts(): Contract[] {
  return contracts
}

export function getContractById(id: string): Contract | undefined {
  return contracts.find(c => c.id === id)
}

export function getContractByCode(code: string): Contract | undefined {
  return contracts.find(c => c.code === code)
}

export function addContract(contract: Contract): void {
  contracts.push(contract)
}

export function updateContract(id: string, updates: Partial<Contract>): Contract | undefined {
  const idx = contracts.findIndex(c => c.id === id)
  if (idx === -1) return undefined
  contracts[idx] = { ...contracts[idx], ...updates, updatedAt: new Date().toISOString() }
  return contracts[idx]
}

export function deleteContract(id: string): boolean {
  const idx = contracts.findIndex(c => c.id === id)
  if (idx === -1) return false
  contracts.splice(idx, 1)
  return true
}

export function getTemplates(): Template[] {
  return templates
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}

export function addTemplate(template: Template): void {
  templates.push(template)
}

export function updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
  const idx = templates.findIndex(t => t.id === id)
  if (idx === -1) return undefined
  templates[idx] = { ...templates[idx], ...updates, updatedAt: new Date().toISOString() }
  return templates[idx]
}

export function deleteTemplate(id: string): boolean {
  const idx = templates.findIndex(t => t.id === id)
  if (idx === -1) return false
  templates.splice(idx, 1)
  return true
}

export function incrementTemplateUsage(id: string): void {
  const idx = templates.findIndex(t => t.id === id)
  if (idx !== -1) {
    templates[idx].usageCount++
  }
}

export function getReminders(): Reminder[] {
  return reminders
}

export function getReminderById(id: string): Reminder | undefined {
  return reminders.find(r => r.id === id)
}

export function addReminder(reminder: Reminder): void {
  reminders.push(reminder)
}

export function markReminderRead(id: string): Reminder | undefined {
  const idx = reminders.findIndex(r => r.id === id)
  if (idx === -1) return undefined
  reminders[idx].read = true
  return reminders[idx]
}

export function findSignerById(signerId: string): { contract: Contract; signer: Contract['signingFlow'] extends object ? Contract['signingFlow']['signers'][number] : never } | undefined {
  for (const contract of contracts) {
    if (contract.signingFlow) {
      const signer = contract.signingFlow.signers.find(s => s.id === signerId)
      if (signer) {
        return { contract, signer } as any
      }
    }
  }
  return undefined
}
