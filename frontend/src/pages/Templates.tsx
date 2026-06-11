import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { useStore } from '@/store'
import { templateApi } from '@/api'
import type { Template } from '@/types'

export default function Templates() {
  const navigate = useNavigate()
  const { templates, setTemplates } = useStore()

  useEffect(() => {
    templateApi.list().then(setTemplates).catch(() => {})
  }, [setTemplates])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F]">模板管理</h2>
        <button
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
        >
          <Plus size={18} />
          创建模板
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          暂无模板记录
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {templates.map((template: Template) => (
            <div key={template.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                  <FileText size={20} className="text-[#1E3A5F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1E3A5F] truncate">{template.name}</h3>
                  <p className="text-xs text-gray-400">使用 {template.usageCount} 次</p>
                </div>
              </div>

              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.variables.map((v) => (
                    <span key={v} className="px-2 py-0.5 text-xs bg-[#D4A843]/10 text-[#D4A843] rounded">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-gray-400">
                  更新于 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/templates/${template.id}/generate`)}
                    className="px-3 py-1.5 text-xs bg-[#D4A843]/10 text-[#D4A843] rounded-lg hover:bg-[#D4A843]/20 transition-colors"
                  >
                    生成合同
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
