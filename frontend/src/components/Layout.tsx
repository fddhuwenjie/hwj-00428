import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, FileText, FileCode, Bell } from 'lucide-react'
import { useSigningContext } from '@/contexts/SigningContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/contracts', icon: FileText, label: '合同管理' },
  { to: '/templates', icon: FileCode, label: '模板管理' },
  { to: '/reminders', icon: Bell, label: '提醒管理' },
]

export default function Layout() {
  const { unreadReminderCount } = useSigningContext()
  const unreadCount = unreadReminderCount()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-['Playfair_Display'] text-xl font-bold tracking-wide">
            <span className="text-[#D4A843]">Sign</span>Contract
          </h1>
          <p className="text-xs text-white/50 mt-1">电子签名与合同管理</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-[#D4A843] border-r-3 border-[#D4A843]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.to === '/reminders' && unreadCount > 0 && (
                <span className="ml-auto bg-[#E74C3C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-white/30">
          v1.0.0
        </div>
      </aside>
      <main className="ml-64 flex-1 bg-[#F8F9FA] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
