import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { templateApi, contractApi } from '@/api'
import { useStore } from '@/store'
import type { Template } from '@/types'

export default function GenerateContract() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addContract = useStore((s) => s.addContract)
  const [template, setTemplate] = useState<Template | null>(null)
  const [title, setTitle] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    templateApi.get(id).then((data) => {
      setTemplate(data)
      setTitle(`${data.name} - 合同`)
      const vars: Record<string, string> = {}
      data.variables.forEach((v) => { vars[v] = '' })
      setVariables(vars)
    }).catch(() => navigate('/templates'))
  }, [id, navigate])

  const preview = useMemo(() => {
    if (!template) return ''
    let content = template.content
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
    })
    return content
  }, [template, variables])

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerate = async () => {
    if (!id) return
    if (!title.trim()) { alert('请输入合同标题'); return }
    const emptyVars = Object.entries(variables).filter(([, v]) => !v.trim())
    if (emptyVars.length > 0) { alert(`请填写变量：${emptyVars.map(([k]) => k).join('、')}`); return }
    setSaving(true)
    try {
      const data = await templateApi.generate(id, { title, variables, deadline: deadline || undefined })
      addContract(data)
      navigate(`/contracts/${data.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '生成失败')
    } finally {
      setSaving(false)
    }
  }

  if (!template) return <div className="p-8 text-gray-400">加载中...</div>

  return (
    <div className="p-8">
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-6">
        从模板生成合同
      </h2>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                <FileText size={20} className="text-[#1E3A5F]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1E3A5F]">{template.name}</h3>
                <p className="text-xs text-gray-400">{template.variables.length} 个变量</p>
              </div>
            </div>

            <div className="space-y-4">
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

              {template.variables.map((v) => (
                <div key={v}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-[#D4A843]">{`{{${v}}}`}</span>
                  </label>
                  <input
                    type="text"
                    value={variables[v] || ''}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    placeholder={`请输入 ${v} 的值`}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => navigate('/templates')}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                >
                  {saving ? '生成中...' : '生成合同'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">实时预览</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{preview}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
