import { useState } from 'react'
import { Shield, Search } from 'lucide-react'
import { contractApi } from '@/api'
import type { Contract, ContractStatus } from '@/types'

const statusLabels: Record<ContractStatus, string> = {
  draft: '草稿', pending: '待签署', signing: '签署中', signed: '已签署', rejected: '已拒绝', expired: '已过期',
}

export default function VerifyContract() {
  const [code, setCode] = useState('')
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!code.trim()) { alert('请输入合同编号'); return }
    setLoading(true)
    setError('')
    setContract(null)
    try {
      const data = await contractApi.verify(code.trim())
      setContract(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={28} className="text-[#1E3A5F]" />
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F]">合同验证</h2>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-sm text-gray-500 mb-4">输入合同编号以验证签署状态和签名真伪</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入合同编号（如 CT-20260101-0001）"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-6 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
          >
            {loading ? '验证中...' : '验证'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-[#E74C3C]/10 text-[#E74C3C] rounded-lg text-sm">
            {error}
          </div>
        )}

        {contract && (
          <div className="mt-4 p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${contract.status === 'signed' ? 'bg-[#2ECC71]' : contract.status === 'rejected' || contract.status === 'expired' ? 'bg-[#E74C3C]' : 'bg-[#3498DB]'}`} />
              <span className="font-semibold text-[#1E3A5F]">
                合同{contract.status === 'signed' ? '验证通过' : contract.status === 'rejected' ? '已被拒绝' : contract.status === 'expired' ? '已过期' : '验证有效'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              合同标题：<span className="font-medium text-gray-700">{contract.title}</span>
            </div>
            <div className="text-sm text-gray-500">
              合同编号：<span className="font-medium text-gray-700">{contract.code}</span>
            </div>
            <div className="text-sm text-gray-500">
              合同状态：<span className="font-medium text-gray-700">{statusLabels[contract.status]}</span>
            </div>
            {contract.signingFlow && contract.signingFlow.signers.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">签署人信息：</p>
                <div className="space-y-2">
                  {contract.signingFlow.signers.map((signer) => (
                    <div key={signer.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signer.status === 'signed' ? 'bg-[#2ECC71]' : signer.status === 'rejected' ? 'bg-[#E74C3C]' : 'bg-gray-300'}`} />
                      <span className="text-gray-700">{signer.name}</span>
                      <span className="text-gray-400">- {signer.status === 'signed' ? '已签署' : signer.status === 'rejected' ? '已拒绝' : signer.status === 'expired' ? '已过期' : '待签署'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
