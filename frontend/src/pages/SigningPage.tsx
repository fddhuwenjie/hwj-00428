import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, User, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { signingApi } from '@/api'
import SignatureCanvas from '@/components/SignatureCanvas'
import Watermark from '@/components/Watermark'
import type { Contract, Signer } from '@/types'

const signerStatusLabels: Record<string, string> = {
  pending: '待签署',
  signed: '已签署',
  rejected: '已拒签',
  expired: '已过期',
  delegated: '已委托',
  signed_by_delegate: '已签署(委托)',
}

export default function SigningPage() {
  const { contractId, signerId } = useParams<{ contractId: string; signerId: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [delegating, setDelegating] = useState(false)
  const [delegateName, setDelegateName] = useState('')
  const [delegateEmail, setDelegateEmail] = useState('')
  const [delegateSuccess, setDelegateSuccess] = useState<{ message: string; newSignerId: string } | null>(null)

  useEffect(() => {
    if (!signerId) return
    signingApi.getSigner(signerId).then((data) => {
      setContract(data.contract)
      setSigner(data.signer)
    }).catch(() => navigate('/contracts'))
  }, [signerId, navigate])

  if (!contract || !signer) return <div className="p-8 text-gray-400">加载中...</div>

  const handleSign = async () => {
    if (!signatureBase64 || !signerId) { alert('请先完成签名'); return }
    setSubmitting(true)
    try {
      await signingApi.sign(signerId, { signatureImage: signatureBase64 })
      alert('签署成功')
      navigate(`/contracts/${contractId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '签署失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim() || !signerId) { alert('请填写拒绝原因'); return }
    setSubmitting(true)
    try {
      await signingApi.reject(signerId, { reason: rejectReason })
      alert('已拒绝签署')
      navigate(`/contracts/${contractId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelegate = async () => {
    if (!delegateName.trim() || !delegateEmail.trim() || !signerId) {
      alert('请填写受托人姓名和邮箱')
      return
    }
    if (signer.delegateInfo) {
      alert('受托人不可再委托')
      return
    }
    setSubmitting(true)
    try {
      const result = await signingApi.delegate(signerId, {
        delegateName: delegateName.trim(),
        delegateEmail: delegateEmail.trim(),
      })
      setDelegateSuccess({ message: result.message, newSignerId: result.newSignerId })
    } catch (err) {
      alert(err instanceof Error ? err.message : '委托失败')
    } finally {
      setSubmitting(false)
    }
  }

  const isDelegateSigner = !!signer.delegateInfo

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8 overflow-y-auto bg-[#F8F9FA]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/contracts/${contractId}`)} className="text-gray-400 hover:text-[#1E3A5F]">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F]">{contract.title}</h2>
            <p className="text-sm text-gray-400">编号：{contract.code}</p>
          </div>
        </div>
        <Watermark
          text="内部文件"
          userName={signer.name}
          viewTime={new Date().toLocaleString('zh-CN')}
        >
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{contract.content}</ReactMarkdown>
            </div>
          </div>
        </Watermark>
      </div>

      <div className="w-96 bg-white border-l p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">签署合同</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">签署人：{signer.name}</p>
          <p className="text-sm text-gray-400 mb-1">邮箱：{signer.email}</p>
          <span className={`inline-block text-xs px-2 py-0.5 rounded ${
            signer.status === 'delegated' ? 'bg-purple-100 text-purple-700' :
            signer.status === 'signed_by_delegate' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {signerStatusLabels[signer.status]}
          </span>
          {signer.delegateInfo && (
            <p className="text-xs text-purple-600 mt-2">
              {isDelegateSigner
                ? `代 ${signer.delegateInfo.originalSignerName} 签署`
                : `已委托给 ${signer.delegateInfo.delegateSignerName}`
              }
            </p>
          )}
        </div>

        {delegateSuccess ? (
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">委托成功</span>
            </div>
            <p className="text-sm text-green-700 mb-3">{delegateSuccess.message}</p>
            <div className="bg-green-100 rounded p-2 text-xs text-green-800 font-mono break-all">
              签署链接：/signing/{contractId}/{delegateSuccess.newSignerId}
            </div>
            <button
              onClick={() => navigate(`/contracts/${contractId}`)}
              className="mt-4 w-full px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
            >
              返回合同详情
            </button>
          </div>
        ) : delegating ? (
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">委托他人签署</label>
              <p className="text-xs text-gray-500 mb-4">
                委托后，您的状态将变为"已委托"，受托人签署后您将自动标记为"已签署(委托)"。委托链条最多1层。
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="受托人姓名"
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                />
                <input
                  type="email"
                  placeholder="受托人邮箱"
                  value={delegateEmail}
                  onChange={(e) => setDelegateEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleDelegate}
                disabled={!delegateName.trim() || !delegateEmail.trim() || submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <User size={18} />
                {submitting ? '提交中...' : '确认委托'}
              </button>
              <button
                onClick={() => { setDelegating(false); setDelegateName(''); setDelegateEmail('') }}
                className="w-full px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">请在下方签名区域手写签名</p>
            <SignatureCanvas width={340} height={160} onSignatureChange={setSignatureBase64} />

            <div className="mt-6 space-y-3 flex-1">
              {!rejecting ? (
                <>
                  <button
                    onClick={handleSign}
                    disabled={!signatureBase64 || submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27ae60] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle size={18} />
                    {submitting ? '提交中...' : '确认签署'}
                  </button>

                  {!signer.delegateInfo && signer.status === 'pending' && (
                    <button
                      onClick={() => setDelegating(true)}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#1E3A5F] text-[#1E3A5F] rounded-lg hover:bg-[#1E3A5F]/5 disabled:opacity-50 transition-colors"
                    >
                      <User size={18} />
                      委托他人
                    </button>
                  )}

                  <button
                    onClick={() => setRejecting(true)}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#E74C3C] text-[#E74C3C] rounded-lg hover:bg-[#E74C3C]/5 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={18} />
                    拒绝签署
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请填写拒绝原因..."
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E74C3C]/30"
                  />
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || submitting}
                    className="w-full px-4 py-3 bg-[#E74C3C] text-white rounded-lg hover:bg-[#c0392b] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? '提交中...' : '确认拒绝'}
                  </button>
                  <button
                    onClick={() => { setRejecting(false); setRejectReason('') }}
                    className="w-full px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
