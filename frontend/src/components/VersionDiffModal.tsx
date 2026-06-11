import { useState, useEffect } from 'react'
import { X, GitCompare } from 'lucide-react'
import { contractApi } from '@/api'
import { computeDiff, getDiffLineBgColor, getDiffLineTextColor } from '@/utils/diff'
import type { ContractVersion, DiffLine } from '@/types'

interface VersionDiffModalProps {
  contractId: string
  versions: ContractVersion[]
  onClose: () => void
}

export default function VersionDiffModal({ contractId, versions, onClose }: VersionDiffModalProps) {
  const [version1, setVersion1] = useState<string>('')
  const [version2, setVersion2] = useState<string>('')
  const [v1Content, setV1Content] = useState<string>('')
  const [v2Content, setV2Content] = useState<string>('')
  const [diff, setDiff] = useState<DiffLine[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (versions.length >= 2) {
      setVersion1(versions[versions.length - 1].version)
      setVersion2(versions[0].version)
    }
  }, [versions])

  useEffect(() => {
    if (!version1 || !version2) return
    loadAndCompare()
  }, [version1, version2])

  const loadAndCompare = async () => {
    setLoading(true)
    try {
      const [v1, v2] = await Promise.all([
        contractApi.getVersion(contractId, version1),
        contractApi.getVersion(contractId, version2),
      ])
      setV1Content(v1.content)
      setV2Content(v2.content)
      const diffResult = computeDiff(v1.content, v2.content)
      setDiff(diffResult)
    } catch (err) {
      alert(err instanceof Error ? err.message : '对比失败')
    } finally {
      setLoading(false)
    }
  }

  const addedCount = diff.filter(d => d.type === 'added').length
  const removedCount = diff.filter(d => d.type === 'removed').length
  const modifiedCount = diff.filter(d => d.type === 'modified').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-[#1E3A5F] flex items-center gap-2">
            <GitCompare size={20} />
            版本对比
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">版本1（旧）</label>
              <select
                value={version1}
                onChange={(e) => setVersion1(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version} - {v.summary}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-gray-400 mt-6">
              <GitCompare size={24} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">版本2（新）</label>
              <select
                value={version2}
                onChange={(e) => setVersion2(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version} - {v.summary}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
              新增 {addedCount} 行
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-300"></span>
              删除 {removedCount} 行
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
              修改 {modifiedCount} 行
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">加载对比结果...</div>
          ) : diff.length === 0 ? (
            <div className="text-center text-gray-400 py-12">请选择两个版本进行对比</div>
          ) : (
            <div className="font-mono text-sm">
              {diff.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex ${getDiffLineBgColor(line.type)} ${getDiffLineTextColor(line.type)} px-3 py-0.5 border-b border-gray-100`}
                >
                  <span className="w-12 text-right text-gray-400 pr-4 select-none">
                    {line.oldLineNumber || ''}
                  </span>
                  <span className="w-12 text-right text-gray-400 pr-4 select-none">
                    {line.newLineNumber || ''}
                  </span>
                  <span className="w-6 text-center select-none">
                    {line.type === 'added' && '+'}
                    {line.type === 'removed' && '-'}
                    {line.type === 'modified' && '~'}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">{line.content || ' '}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
