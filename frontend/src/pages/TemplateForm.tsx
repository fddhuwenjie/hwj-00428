import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { templateApi } from '@/api'
import { useStore } from '@/store'

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}

export default function TemplateForm() {
  const navigate = useNavigate()
  const addTemplate = useStore((s) => s.addTemplate)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const variables = useMemo(() => extractVariables(content), [content])

  const handleSave = async () => {
    if (!name.trim()) { alert('请输入模板名称'); return }
    setSaving(true)
    try {
      const data = await templateApi.create({ name, content, variables })
      addTemplate(data)
      navigate('/templates')
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-6">创建模板</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入模板名称"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模板内容</label>
            <p className="text-xs text-gray-400 mb-2">
              使用 {'{{变量名}}'} 语法插入变量，如 {'{{甲方}}'}、{'{{金额}}'}
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`合同正文...\n\n甲方：{{甲方}}\n乙方：{{乙方}}\n金额：{{金额}}元`}
              rows={15}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 resize-y font-mono"
            />
          </div>

          {variables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自动提取的变量</label>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <span key={v} className="px-2.5 py-1 text-xs bg-[#D4A843]/10 text-[#D4A843] rounded-lg">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => navigate('/templates')}
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
              {saving ? '保存中...' : '保存模板'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
