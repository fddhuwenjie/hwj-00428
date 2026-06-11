import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Send } from 'lucide-react'
import { contractApi } from '@/api'
import { useContractContext } from '@/contexts/ContractContext'
import ReactMarkdown from 'react-markdown'

export default function ContractForm() {
  const navigate = useNavigate()
  const { addContract } = useContractContext()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) { alert('请输入合同标题'); return }
    setSaving(true)
    try {
      const data = await contractApi.create({ title, content, deadline: deadline || undefined })
      addContract(data)
      navigate(`/contracts/${data.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-6">新建合同</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">合同标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入合同标题"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">合同内容</label>
              <button
                onClick={() => setPreview(!preview)}
                className={`text-xs px-2 py-1 rounded ${preview ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {preview ? '编辑' : '预览'}
              </button>
            </div>
            {preview ? (
              <div className="border rounded-lg p-4 min-h-[300px] prose prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入合同内容（支持 Markdown 语法）"
                rows={15}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 resize-y"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2ECC71] text-white rounded-lg hover:bg-[#27ae60] disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
              {saving ? '保存中...' : '保存并发起'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
