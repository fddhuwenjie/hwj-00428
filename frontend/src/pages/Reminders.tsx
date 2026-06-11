import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import { useSigningContext } from '@/contexts/SigningContext'
import { reminderApi, contractApi } from '@/api'
import type { Reminder } from '@/types'

const typeIcons = {
  expiring: <Clock size={16} className="text-[#E74C3C]" />,
  renewal: <RefreshCw size={16} className="text-[#3498DB]" />,
  follow_up: <AlertTriangle size={16} className="text-[#D4A843]" />,
}

const typeLabels = {
  expiring: '即将到期',
  renewal: '续签提醒',
  follow_up: '催签提醒',
}

export default function Reminders() {
  const { reminders, setReminders, markReminderRead } = useSigningContext()
  const [contractTitles, setContractTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    reminderApi.list().then((data) => {
      setReminders(data)
      const ids = [...new Set(data.map((r) => r.contractId))]
      ids.forEach((id) => {
        contractApi.get(id).then((c) => {
          setContractTitles((prev) => ({ ...prev, [id]: c.title }))
        }).catch(() => {})
      })
    }).catch(() => {})
  }, [setReminders])

  const handleMarkRead = async (id: string) => {
    await reminderApi.markRead(id)
    markReminderRead(id)
  }

  const handleRemind = async (contractId: string) => {
    await contractApi.remind(contractId)
    alert('催签通知已发送')
  }

  const unread = reminders.filter((r) => !r.read)
  const read = reminders.filter((r) => r.read)

  const renderItem = (reminder: Reminder) => (
    <div key={reminder.id} className={`bg-white rounded-xl p-5 shadow-sm ${!reminder.read ? 'border-l-4 border-[#D4A843]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{typeIcons[reminder.type]}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-0.5 rounded">
                {typeLabels[reminder.type]}
              </span>
              {!reminder.read && (
                <span className="w-2 h-2 rounded-full bg-[#D4A843]" />
              )}
            </div>
            <p className="text-sm text-gray-700 mb-1">{reminder.message}</p>
            <p className="text-xs text-gray-400">
              关联合同：{contractTitles[reminder.contractId] || reminder.contractId} | {new Date(reminder.sentAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!reminder.read && (
            <button
              onClick={() => handleMarkRead(reminder.id)}
              className="flex items-center gap-1 text-xs text-[#1E3A5F] hover:text-[#D4A843] transition-colors"
            >
              <CheckCircle size={14} />
              标记已读
            </button>
          )}
          {reminder.type === 'follow_up' && (
            <button
              onClick={() => handleRemind(reminder.contractId)}
              className="flex items-center gap-1 text-xs text-[#D4A843] hover:text-[#b8922e] transition-colors"
            >
              <AlertTriangle size={14} />
              催签
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-6">提醒管理</h2>

      {unread.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">未读提醒 ({unread.length})</h3>
          <div className="space-y-3">
            {unread.map(renderItem)}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">已读提醒</h3>
          <div className="space-y-3">
            {read.map(renderItem)}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          暂无提醒
        </div>
      )}
    </div>
  )
}
