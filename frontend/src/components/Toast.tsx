import { useEffect } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useUIContext } from '@/contexts/UIContext'

const icons = {
  success: <CheckCircle size={20} className="text-[#2ECC71]" />,
  error: <XCircle size={20} className="text-[#E74C3C]" />,
  info: <Info size={20} className="text-[#3498DB]" />,
}

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
}

export default function Toast() {
  const { toast, clearToast } = useUIContext()

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[toast.type]}`}
      >
        {icons[toast.type]}
        <span className="text-sm text-gray-700">{toast.message}</span>
      </div>
    </div>
  )
}
