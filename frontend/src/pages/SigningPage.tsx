import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { signingApi } from '@/api'
import SignatureCanvas from '@/components/SignatureCanvas'
import type { Contract, Signer } from '@/types'

export default function SigningPage() {
  const { contractId, signerId } = useParams<{ contractId: string; signerId: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8 overflow-y-auto bg-[#F8F9FA]">
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-2">{contract.title}</h2>
        <p className="text-sm text-gray-400 mb-6">编号：{contract.code}</p>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{contract.content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">签署合同</h3>
        <p className="text-sm text-gray-500 mb-1">签署人：{signer.name}</p>
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
      </div>
    </div>
  )
}
