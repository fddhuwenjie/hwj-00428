import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileDown, Send, AlertTriangle, CheckCircle2, Clock, XCircle, Shield } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { contractApi } from '@/api'
import { useStore } from '@/store'
import { exportToPdf } from '@/components/PdfExporter'
import CreateSigningModal from '@/components/CreateSigningModal'
import type { Contract, ContractStatus } from '@/types'

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

const signerStatusIcon = {
  pending: <Clock size={16} className="text-gray-400" />,
  signed: <CheckCircle2 size={16} className="text-[#2ECC71]" />,
  rejected: <XCircle size={16} className="text-[#E74C3C]" />,
  expired: <XCircle size={16} className="text-gray-500" />,
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateContract = useStore((s) => s.updateContract)
  const [contract, setContract] = useState<Contract | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [reminding, setReminding] = useState(false)

  useEffect(() => {
    if (!id) return
    contractApi.get(id).then(setContract).catch(() => navigate('/contracts'))
  }, [id, navigate])

  if (!contract) return <div className="p-8 text-gray-400">加载中...</div>

  const handlePdfExport = async () => {
    try {
      await exportToPdf('contract-content', `${contract.title}.pdf`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '导出失败')
    }
  }

  const handleRemind = async () => {
    if (!id) return
    setReminding(true)
    try {
      await contractApi.remind(id)
      alert('催签通知已发送')
    } catch (err) {
      alert(err instanceof Error ? err.message : '催签失败')
    } finally {
      setReminding(false)
    }
  }

  const handleCreateFlowSuccess = () => {
    setShowModal(false)
    if (id) {
      contractApi.get(id).then((data) => {
        setContract(data)
        updateContract(id, data)
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contracts')} className="text-gray-400 hover:text-[#1E3A5F]">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F]">{contract.title}</h2>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[contract.status]}`}>
            {statusLabels[contract.status]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/verify')}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield size={16} />
            验证
          </button>
          <button
            onClick={handlePdfExport}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileDown size={16} />
            PDF导出
          </button>
          {(contract.status === 'draft' || contract.status === 'pending') && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
            >
              <Send size={16} />
              创建签署流程
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div id="contract-content" className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">合同正文</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{contract.content}</ReactMarkdown>
            </div>
            {contract.signingFlow?.signers?.filter((s) => s.status === 'signed').map((s) => s.signatureImage).filter(Boolean).length ? (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-[#1E3A5F] mb-3">签名</h4>
                <div className="grid grid-cols-2 gap-4">
                  {contract.signingFlow.signers
                    .filter((s) => s.status === 'signed' && s.signatureImage)
                    .map((s) => (
                      <div key={s.id} className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">{s.name}</p>
                        <img src={s.signatureImage} alt={`${s.name}签名`} className="max-h-20" />
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">合同信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">编号</span><span>{contract.code}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">状态</span><span>{statusLabels[contract.status]}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">截止日期</span><span>{contract.deadline ? new Date(contract.deadline).toLocaleDateString('zh-CN') : '未设置'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">创建时间</span><span>{new Date(contract.createdAt).toLocaleDateString('zh-CN')}</span></div>
              {contract.signedAt && (
                <div className="flex justify-between"><span className="text-gray-400">签署时间</span><span>{new Date(contract.signedAt).toLocaleDateString('zh-CN')}</span></div>
              )}
            </div>
          </div>

          {contract.signingFlow && (
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">
                签署流程（{contract.signingFlow.mode === 'sequential' ? '顺序签' : '同时签'}）
              </h3>
              <div className="space-y-3">
                {contract.signingFlow.signers.map((signer, idx) => (
                  <div key={signer.id} className="flex items-center gap-3">
                    <div className="relative flex flex-col items-center">
                      {signerStatusIcon[signer.status]}
                      {idx < contract.signingFlow!.signers.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{signer.name}</p>
                      <p className="text-xs text-gray-400 truncate">{signer.email}</p>
                      {signer.signedAt && (
                        <p className="text-xs text-[#2ECC71]">已签署 {new Date(signer.signedAt).toLocaleDateString('zh-CN')}</p>
                      )}
                      {signer.rejectedReason && (
                        <p className="text-xs text-[#E74C3C]">拒绝原因：{signer.rejectedReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {contract.signingFlow.signers.some((s) => s.status === 'pending') && (
                <button
                  onClick={handleRemind}
                  disabled={reminding}
                  className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-[#D4A843] hover:text-[#b8922e] disabled:opacity-50"
                >
                  <AlertTriangle size={12} />
                  {reminding ? '发送中...' : '催签全部待签人'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CreateSigningModal contractId={contract.id} onClose={() => setShowModal(false)} onSuccess={handleCreateFlowSuccess} />
      )}
    </div>
  )
}
