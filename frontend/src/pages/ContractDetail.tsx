import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileDown, Send, AlertTriangle, CheckCircle2, Clock, XCircle, Shield,
  GitBranch, ListTodo, History, RotateCcw, GitCompare, User, FileText, Clock4
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { contractApi } from '@/api'
import { useStore } from '@/store'
import { exportToPdf } from '@/components/PdfExporter'
import CreateSigningModal from '@/components/CreateSigningModal'
import VersionDiffModal from '@/components/VersionDiffModal'
import Watermark from '@/components/Watermark'
import type { Contract, ContractStatus, ContractVersion, AuditLogEntry } from '@/types'

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
  delegated: <User size={16} className="text-purple-500" />,
  signed_by_delegate: <CheckCircle2 size={16} className="text-purple-600" />,
}

const signerStatusLabels: Record<string, string> = {
  pending: '待签署',
  signed: '已签署',
  rejected: '已拒签',
  expired: '已过期',
  delegated: '已委托',
  signed_by_delegate: '已签署(委托)',
}

const actionLabels: Record<string, string> = {
  create: '创建',
  edit: '编辑',
  initiate_signing: '发起签署',
  sign: '签署',
  reject: '拒签',
  delegate: '委托',
  remind: '催签',
  export_pdf: '导出PDF',
  verify: '验证',
  rollback: '回滚',
  batch_sign: '批量签署',
}

const actionColors: Record<string, string> = {
  create: 'bg-blue-500',
  edit: 'bg-yellow-500',
  initiate_signing: 'bg-purple-500',
  sign: 'bg-green-500',
  reject: 'bg-red-500',
  delegate: 'bg-purple-400',
  remind: 'bg-orange-500',
  export_pdf: 'bg-indigo-500',
  verify: 'bg-cyan-500',
  rollback: 'bg-pink-500',
  batch_sign: 'bg-violet-500',
}

type TabType = 'content' | 'versions' | 'audit'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateContract = useStore((s) => s.updateContract)
  const [contract, setContract] = useState<Contract | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [showModal, setShowModal] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [versions, setVersions] = useState<ContractVersion[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null)
  const [currentUser] = useState('当前用户')

  useEffect(() => {
    if (!id) return
    contractApi.get(id).then(setContract).catch(() => navigate('/contracts'))
  }, [id, navigate])

  useEffect(() => {
    if (!id || activeTab !== 'versions') return
    loadVersions()
  }, [id, activeTab])

  useEffect(() => {
    if (!id || activeTab !== 'audit') return
    loadAuditLog()
  }, [id, activeTab])

  const loadVersions = async () => {
    if (!id) return
    setLoadingVersions(true)
    try {
      const data = await contractApi.getVersions(id)
      setVersions(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载版本失败')
    } finally {
      setLoadingVersions(false)
    }
  }

  const loadAuditLog = async () => {
    if (!id) return
    setLoadingAudit(true)
    try {
      const data = await contractApi.getAuditLog(id)
      setAuditLogs(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载审计日志失败')
    } finally {
      setLoadingAudit(false)
    }
  }

  const handlePdfExport = async () => {
    if (!contract) return
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

  const handleRollback = async (version: string) => {
    if (!id || !contract) return
    if (contract.status === 'signing' || contract.status === 'signed') {
      alert('已进入签署流程的合同不允许回滚')
      return
    }
    if (!confirm(`确定要回滚到版本 ${version} 吗？回滚后将生成新版本记录。`)) return

    setRollbackLoading(version)
    try {
      const updated = await contractApi.rollbackToVersion(id, version)
      setContract(updated)
      updateContract(id, updated)
      await loadVersions()
      alert(`已成功回滚到版本 ${version}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '回滚失败')
    } finally {
      setRollbackLoading(null)
    }
  }

  const handleExportPdfWithLog = async () => {
    await handlePdfExport()
    if (contract) {
      await loadAuditLog()
    }
  }

  if (!contract) return <div className="p-8 text-gray-400">加载中...</div>

  const canRollback = contract.status !== 'signing' && contract.status !== 'signed'

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
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <GitBranch size={12} />
            {contract.currentVersion}
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
            onClick={handleExportPdfWithLog}
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

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'content'
              ? 'border-[#1E3A5F] text-[#1E3A5F]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} />
          合同内容
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'versions'
              ? 'border-[#1E3A5F] text-[#1E3A5F]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} />
          版本历史
          {contract.versions && contract.versions.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {contract.versions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-[#1E3A5F] text-[#1E3A5F]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListTodo size={16} />
          审计日志
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {activeTab === 'content' && (
            <Watermark
              text="内部文件"
              userName={currentUser}
              viewTime={new Date().toLocaleString('zh-CN')}
            >
              <div id="contract-content" className="bg-white rounded-xl p-6 shadow-sm relative">
                <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">合同正文</h3>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{contract.content}</ReactMarkdown>
                </div>
                {contract.signingFlow?.signers?.filter((s) => s.status === 'signed' || s.status === 'signed_by_delegate').map((s) => s.signatureImage).filter(Boolean).length ? (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-[#1E3A5F] mb-3">签名</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {contract.signingFlow.signers
                        .filter((s) => (s.status === 'signed' || s.status === 'signed_by_delegate') && s.signatureImage)
                        .map((s) => (
                          <div key={s.id} className="border rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">
                              {s.name}
                              {s.status === 'signed_by_delegate' && s.delegateInfo && (
                                <span className="text-purple-600 ml-1">
                                  (由{s.delegateInfo.delegateSignerName}代签)
                                </span>
                              )}
                            </p>
                            <img src={s.signatureImage} alt={`${s.name}签名`} className="max-h-20" />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Watermark>
          )}

          {activeTab === 'versions' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1E3A5F]">版本历史</h3>
                {versions.length >= 2 && (
                  <button
                    onClick={() => setShowDiffModal(true)}
                    className="flex items-center gap-1 text-sm text-[#1E3A5F] hover:text-[#D4A843] transition-colors"
                  >
                    <GitCompare size={14} />
                    对比版本
                  </button>
                )}
              </div>

              {loadingVersions ? (
                <div className="text-center text-gray-400 py-12">加载中...</div>
              ) : versions.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无版本记录</div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, idx) => (
                    <div
                      key={version.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        version.version === contract.currentVersion
                          ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          version.version === contract.currentVersion ? 'bg-[#1E3A5F]' : 'bg-gray-400'
                        }`}>
                          {version.version.replace('v', '')}
                        </div>
                        {idx < versions.length - 1 && (
                          <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-gray-200 -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#1E3A5F]">{version.version}</span>
                          {version.version === contract.currentVersion && (
                            <span className="text-xs bg-[#1E3A5F] text-white px-2 py-0.5 rounded-full">
                              当前版本
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{version.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {version.modifiedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock4 size={12} />
                            {new Date(version.modifiedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      {canRollback && version.version !== contract.currentVersion && (
                        <button
                          onClick={() => handleRollback(version.version)}
                          disabled={rollbackLoading === version.version}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw size={12} />
                          {rollbackLoading === version.version ? '回滚中...' : '回滚到此版本'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1E3A5F] mb-4">审计日志</h3>

              {loadingAudit ? (
                <div className="text-center text-gray-400 py-12">加载中...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center text-gray-400 py-12">暂无审计记录</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative pl-10">
                        <div className={`absolute left-2 w-5 h-5 rounded-full ${actionColors[log.action]} border-4 border-white shadow`} />
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1E3A5F]">
                                {actionLabels[log.action] || log.action}
                              </span>
                              <span className="text-xs text-gray-500">
                                操作人：{log.operator}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{log.details}</p>
                          {log.ip && (
                            <p className="text-xs text-gray-400 mt-1">IP：{log.ip}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">合同信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">编号</span><span>{contract.code}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">当前版本</span><span className="font-mono">{contract.currentVersion}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">状态</span><span>{statusLabels[contract.status]}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">截止日期</span><span>{contract.deadline ? new Date(contract.deadline).toLocaleDateString('zh-CN') : '未设置'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">创建时间</span><span>{new Date(contract.createdAt).toLocaleDateString('zh-CN')}</span></div>
              {contract.signedAt && (
                <div className="flex justify-between"><span className="text-gray-400">签署时间</span><span>{new Date(contract.signedAt).toLocaleDateString('zh-CN')}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-400">版本数</span><span>{contract.versions?.length || 1}</span></div>
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{signer.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          signer.status === 'delegated' ? 'bg-purple-100 text-purple-700' :
                          signer.status === 'signed_by_delegate' ? 'bg-purple-100 text-purple-700' : ''
                        }`}>
                          {signerStatusLabels[signer.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{signer.email}</p>
                      {signer.signedAt && (
                        <p className="text-xs text-[#2ECC71]">
                          {signer.status === 'signed_by_delegate' ? '代签' : '已签署'} {new Date(signer.signedAt).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                      {signer.rejectedReason && (
                        <p className="text-xs text-[#E74C3C]">拒绝原因：{signer.rejectedReason}</p>
                      )}
                      {signer.delegateInfo && (
                        <p className="text-xs text-purple-600">
                          {signer.status === 'delegated'
                            ? `已委托给 ${signer.delegateInfo.delegateSignerName}`
                            : `代 ${signer.delegateInfo.originalSignerName} 签署`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {contract.signingFlow.signers.some((s) => s.status === 'pending' && !s.delegateInfo) && (
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

      {showDiffModal && versions.length >= 2 && (
        <VersionDiffModal
          contractId={contract.id}
          versions={versions}
          onClose={() => setShowDiffModal(false)}
        />
      )}
    </div>
  )
}
