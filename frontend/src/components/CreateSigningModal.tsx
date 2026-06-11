import { useState } from 'react'
import { X, Plus, GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { contractApi } from '@/api'

interface SignerInput {
  name: string
  email: string
}

interface CreateSigningModalProps {
  contractId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateSigningModal({ contractId, onClose, onSuccess }: CreateSigningModalProps) {
  const [mode, setMode] = useState<'sequential' | 'parallel'>('sequential')
  const [signers, setSigners] = useState<SignerInput[]>([{ name: '', email: '' }])
  const [submitting, setSubmitting] = useState(false)

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
    if (validSigners.length === 0) return
    setSubmitting(true)
    try {
      await contractApi.createSigning(contractId, {
        mode,
        signers: validSigners,
      })
      onSuccess()
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建签署流程失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">创建签署流程</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
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
                  {mode === 'sequential' && (
                    <GripVertical size={16} className="text-gray-300" />
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
                    <Trash2 size={16} />
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
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
          >
            {submitting ? '创建中...' : '确认创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
