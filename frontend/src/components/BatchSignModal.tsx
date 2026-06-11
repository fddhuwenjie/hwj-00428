import { useState } from 'react'
import { X, Plus, ArrowUp, ArrowDown, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { contractApi } from '@/api'

interface SignerInput {
  name: string
  email: string
}

interface BatchSignModalProps {
  selectedContractIds: string[]
  onClose: () => void
  onSuccess: () => void
}

export default function BatchSignModal({ selectedContractIds, onClose, onSuccess }: BatchSignModalProps) {
  const [mode, setMode] = useState<'sequential' | 'parallel'>('sequential')
  const [signers, setSigners] = useState<SignerInput[]>([{ name: '', email: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: string[]; failed: { id: string; reason: string }[] } | null>(null)

  const addSigner = () => {
    setSigners([...signers, { name: '', email: '' }])
  }

  const removeSigner = (index: number) => {
    if (signers.length <= 1) return
    setSigners(signers.filter((_, i) => i !== index))
  }

  const updateSigner = (index: number, field: keyof SignerInput, value: string) => {
    setSigners(signers.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const moveSigner = (index: number, direction: 'up' | 'down') => {
    const newSigners = [...signers]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSigners.length) return
    ;[newSigners[index], newSigners[targetIndex]] = [newSigners[targetIndex], newSigners[index]]
    setSigners(newSigners)
  }

  const handleSubmit = async () => {
    const validSigners = signers.filter((s) => s.name.trim() && s.email.trim())
    if (validSigners.length === 0) {
      alert('请至少填写一个签署人')
      return
    }
    setSubmitting(true)
    try {
      const res = await contractApi.batchSign({
        contractIds: selectedContractIds,
        signers: validSigners,
        mode,
      })
      setResult(res)
      if (res.success.length > 0) {
        onSuccess()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-[#1E3A5F] flex items-center gap-2">
            <Send size={20} />
            批量发起签署
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-auto flex-1">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              已选择 <strong>{selectedContractIds.length}</strong> 份合同，将统一应用以下签署流程
            </p>
          </div>

          {result && (
            <div className="space-y-2">
              {result.success.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">成功 {result.success.length} 份</p>
                  </div>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">失败 {result.failed.length} 份</p>
                    {result.failed.map((f, idx) => (
                      <p key={idx} className="text-xs text-red-600 mt-1">
                        {f.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">签署模式</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="sequential"
                      checked={mode === 'sequential'}
                      onChange={() => setMode('sequential')}
                      className="accent-[#1E3A5F]"
                    />
                    <span className="text-sm">顺序签</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="parallel"
                      checked={mode === 'parallel'}
                      onChange={() => setMode('parallel')}
                      className="accent-[#1E3A5F]"
                    />
                    <span className="text-sm">同时签</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">签署人</label>
                <div className="space-y-3">
                  {signers.map((signer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {mode === 'sequential' && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveSigner(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-[#1E3A5F] disabled:opacity-30"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSigner(index, 'down')}
                            disabled={index === signers.length - 1}
                            className="text-gray-400 hover:text-[#1E3A5F] disabled:opacity-30"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="姓名"
                        value={signer.name}
                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                      />
                      <input
                        type="email"
                        placeholder="邮箱"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                      />
                      <button
                        onClick={() => removeSigner(index)}
                        disabled={signers.length <= 1}
                        className="text-gray-400 hover:text-[#E74C3C] disabled:opacity-30"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addSigner}
                  className="mt-3 flex items-center gap-1 text-sm text-[#1E3A5F] hover:text-[#D4A843] transition-colors"
                >
                  <Plus size={16} />
                  添加签署人
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {result ? '关闭' : '取消'}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
            >
              {submitting ? '处理中...' : '确认发起'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
