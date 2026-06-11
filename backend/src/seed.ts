import { v4 as uuidv4 } from 'uuid'
import { getDb, resetDb } from './db.js'
import {
  addContract,
  addTemplate,
  addReminder,
  addAuditLog,
  getContracts,
  getContractCount
} from './store.js'
import type {
  Contract,
  Template,
  Reminder,
  ContractVersion,
  AuditLogEntry,
  Signer,
  SigningFlow
} from './types.js'

const mockUsers = ['张三', '李四', '王五', '赵六', '系统管理员', 'HR李经理', '总经理']

function getRandomUser(): string {
  return mockUsers[Math.floor(Math.random() * mockUsers.length)]
}

function generateAuditLogs(contract: Contract, templateName?: string): AuditLogEntry[] {
  const logs: AuditLogEntry[] = []
  const baseTime = new Date(contract.createdAt).getTime()

  logs.push({
    id: uuidv4(),
    contractId: contract.id,
    timestamp: contract.createdAt,
    operator: getRandomUser(),
    action: 'create',
    details: templateName ? `基于模板"${templateName}"创建合同` : '创建新合同',
    ip: '192.168.1.100'
  })

  if (contract.status === 'draft') {
    const editTime = new Date(baseTime + 3600000).toISOString()
    logs.push({
      id: uuidv4(),
      contractId: contract.id,
      timestamp: editTime,
      operator: getRandomUser(),
      action: 'edit',
      details: '编辑合同内容和截止日期',
      ip: '192.168.1.101'
    })
  }

  if (contract.status === 'pending') {
    const editTime = new Date(baseTime + 7200000).toISOString()
    logs.push({
      id: uuidv4(),
      contractId: contract.id,
      timestamp: editTime,
      operator: getRandomUser(),
      action: 'edit',
      details: '修改合同条款内容',
      ip: '192.168.1.102'
    })
  }

  if (contract.signingFlow) {
    const initiateTime = contract.signingFlow.signers[0]?.signedAt || new Date(baseTime + 86400000).toISOString()
    logs.push({
      id: uuidv4(),
      contractId: contract.id,
      timestamp: initiateTime,
      operator: getRandomUser(),
      action: 'initiate_signing',
      details: `发起签署流程，${contract.signingFlow.mode === 'sequential' ? '顺序签' : '同时签'}模式，共${contract.signingFlow.signers.length}位签署人`,
      ip: '192.168.1.103'
    })

    contract.signingFlow.signers.forEach((signer) => {
      if (signer.status === 'signed' && signer.signedAt) {
        logs.push({
          id: uuidv4(),
          contractId: contract.id,
          timestamp: signer.signedAt,
          operator: signer.name,
          action: 'sign',
          details: `${signer.name}完成签署`,
          ip: '192.168.1.104'
        })
      }
      if (signer.status === 'rejected') {
        logs.push({
          id: uuidv4(),
          contractId: contract.id,
          timestamp: contract.updatedAt,
          operator: signer.name,
          action: 'reject',
          details: `${signer.name}拒绝签署，原因：${signer.rejectedReason}`,
          ip: '192.168.1.105'
        })
      }
    })

    if (contract.status === 'signing') {
      const remindTime = new Date(baseTime + 172800000).toISOString()
      logs.push({
        id: uuidv4(),
        contractId: contract.id,
        timestamp: remindTime,
        operator: getRandomUser(),
        action: 'remind',
        details: '发送催签通知给待签署人',
        ip: '192.168.1.106'
      })
    }
  }

  if (contract.status === 'signed') {
    const exportTime = new Date(baseTime + 604800000).toISOString()
    logs.push({
      id: uuidv4(),
      contractId: contract.id,
      timestamp: exportTime,
      operator: getRandomUser(),
      action: 'export_pdf',
      details: '导出合同PDF文件',
      ip: '192.168.1.107'
    })
  }

  const verifyTime = new Date(baseTime + 259200000).toISOString()
  logs.push({
    id: uuidv4(),
    contractId: contract.id,
    timestamp: verifyTime,
    operator: '访客',
    action: 'verify',
    details: `通过合同编号${contract.code}验证合同真实性`,
    ip: '10.0.0.50'
  })

  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

function generateInitialVersions(contract: Contract): ContractVersion[] {
  const versions: ContractVersion[] = []
  const baseTime = new Date(contract.createdAt).getTime()

  versions.push({
    id: uuidv4(),
    version: 'v1',
    content: contract.content,
    title: contract.title,
    modifiedAt: contract.createdAt,
    modifiedBy: getRandomUser(),
    summary: '初始版本'
  })

  if (contract.status !== 'draft' || Math.random() > 0.5) {
    const v2Content = contract.content.replace(/[一二三四五六七八九十]/g, (match) => {
      const map: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10' }
      return map[match] || match
    })
    versions.push({
      id: uuidv4(),
      version: 'v2',
      content: v2Content !== contract.content ? v2Content : contract.content + '\n\n补充条款：本合同未尽事宜，双方协商解决。',
      title: contract.title,
      modifiedAt: new Date(baseTime + 3600000).toISOString(),
      modifiedBy: getRandomUser(),
      summary: '完善合同内容，添加补充条款'
    })
  }

  if (contract.status === 'signed' || contract.status === 'signing') {
    versions.push({
      id: uuidv4(),
      version: 'v3',
      content: contract.content,
      title: contract.title,
      modifiedAt: new Date(baseTime + 7200000).toISOString(),
      modifiedBy: getRandomUser(),
      summary: '最终审阅版本，确认无误'
    })
  }

  return versions
}

export function seedDatabase(): void {
  const db = getDb()

  const count = getContractCount()
  if (count > 0) {
    console.log('Database already has data, skipping seed.')
    return
  }

  console.log('Seeding database with initial data...')

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

  templates.forEach(t => addTemplate(t))

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

  const contractsData: Omit<Contract, 'versions' | 'currentVersion'>[] = [
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

  const contracts: Contract[] = contractsData.map((c) => {
    const versions = generateInitialVersions(c as Contract)
    return {
      ...c,
      versions,
      currentVersion: versions[versions.length - 1].version
    }
  })

  contracts.forEach(c => addContract(c))

  contracts.forEach((c) => {
    const template = templates.find(t => t.id === c.templateId)
    const logs = generateAuditLogs(c, template?.name)
    logs.forEach(log => addAuditLog(log))
  })

  const contractList = getContracts()
  const reminders: Reminder[] = [
    {
      id: uuidv4(),
      contractId: contractList[2].id,
      type: 'expiring',
      message: '合同"王五保密协议"将于2025-06-30到期，请及时处理',
      sentAt: '2025-06-15T09:00:00.000Z',
      read: false
    },
    {
      id: uuidv4(),
      contractId: contractList[3].id,
      type: 'expiring',
      message: '合同"赵六保密协议"将于2025-07-31到期，请及时处理',
      sentAt: '2025-06-20T09:00:00.000Z',
      read: false
    },
    {
      id: uuidv4(),
      contractId: contractList[4].id,
      type: 'follow_up',
      message: '合同"陈七劳动合同"正在签署中，HR李经理尚未签署',
      sentAt: '2025-06-01T09:00:00.000Z',
      read: true
    },
    {
      id: uuidv4(),
      contractId: contractList[0].id,
      type: 'renewal',
      message: '合同"张三劳动合同"为草稿状态，请尽快发起签署流程',
      sentAt: '2025-06-10T09:00:00.000Z',
      read: false
    },
    {
      id: uuidv4(),
      contractId: contractList[5].id,
      type: 'follow_up',
      message: '合同"周八服务合同"正在签署中，甲方代表尚未签署',
      sentAt: '2025-06-05T09:00:00.000Z',
      read: false
    }
  ]

  reminders.forEach(r => addReminder(r))

  console.log(`Seeded ${templates.length} templates, ${contracts.length} contracts, ${reminders.length} reminders.`)
}

export function reseedDatabase(): void {
  console.log('Resetting database...')
  resetDb()
  seedDatabase()
  console.log('Database reseeded successfully.')
}
