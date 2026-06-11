import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { useStore } from '@/store'
import { contractApi } from '@/api'
import type { ContractStatus, Contract } from '@/types'

const statusLabels: Record<ContractStatus, string> = {
  draft: '草稿', pending: '待签署', signing: '签署中', signed: '已签署', rejected: '已拒绝', expired: '已过期',
}

const statusColors: Record<ContractStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-600',
  signing: 'bg-orange-100 text-orange-600',
  signed: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-red-900/10 text-red-900',
}

export default function Contracts() {
  const navigate = useNavigate()
  const { contracts, setContracts } = useStore()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    contractApi.list().then(setContracts).catch(() => {})
  }, [setContracts])

  const filtered = contracts.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F]">合同管理</h2>
        <button
          onClick={() => navigate('/contracts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
        >
          <Plus size={18} />
          新建合同
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索合同标题或编号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'pending', 'signing', 'signed', 'rejected', 'expired'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                filter === s
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'all' ? '全部' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          暂无合同记录
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map((contract: Contract) => (
            <div key={contract.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[#1E3A5F] truncate flex-1 mr-2">{contract.title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${statusColors[contract.status]}`}>
                  {statusLabels[contract.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">编号：{contract.code}</p>
              <p className="text-xs text-gray-400 mb-4">创建于 {new Date(contract.createdAt).toLocaleDateString('zh-CN')}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  截止：{contract.deadline ? new Date(contract.deadline).toLocaleDateString('zh-CN') : '未设置'}
                </span>
                <button
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  className="flex items-center gap-1 text-xs text-[#1E3A5F] hover:text-[#D4A843] transition-colors"
                >
                  <Eye size={14} />
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
