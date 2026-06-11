import { useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useContractContext } from '@/contexts/ContractContext'
import { statsApi } from '@/api'

const statCards = [
  { key: 'pending' as const, label: '待签署', icon: Clock, color: '#3498DB', bgColor: '#EBF5FB' },
  { key: 'signing' as const, label: '签署中', icon: FileText, color: '#E67E22', bgColor: '#FDF2E9' },
  { key: 'signed' as const, label: '已签署', icon: CheckCircle, color: '#2ECC71', bgColor: '#EAFAF1' },
  { key: 'rejected' as const, label: '已拒绝', icon: XCircle, color: '#E74C3C', bgColor: '#FDEDEC' },
]

export default function Dashboard() {
  const { dashboardStats, trendData, templateRanking, setDashboardStats, setTrendData, setTemplateRanking } = useContractContext()

  useEffect(() => {
    statsApi.dashboard().then(setDashboardStats).catch(() => {})
    statsApi.trend().then(setTrendData).catch(() => {})
    statsApi.templateRanking().then(setTemplateRanking).catch(() => {})
  }, [setDashboardStats, setTrendData, setTemplateRanking])

  const stats = dashboardStats ?? {
    total: 0, byStatus: { draft: 0, pending: 0, signing: 0, signed: 0, rejected: 0, expired: 0 },
    completionRate: 0, avgSigningDuration: 0, expiringSoon: 0,
  }

  const lineOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['签署数', '创建数'] },
    xAxis: { type: 'category' as const, data: trendData.map((m) => m.month) },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: '签署数',
        data: trendData.map((m) => m.signed),
        type: 'line' as const,
        smooth: true,
        lineStyle: { color: '#1E3A5F', width: 3 },
        itemStyle: { color: '#1E3A5F' },
        areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,58,95,0.3)' }, { offset: 1, color: 'rgba(30,58,95,0.02)' }] } },
      },
      {
        name: '创建数',
        data: trendData.map((m) => m.created),
        type: 'line' as const,
        smooth: true,
        lineStyle: { color: '#D4A843', width: 3 },
        itemStyle: { color: '#D4A843' },
        areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(212,168,67,0.3)' }, { offset: 1, color: 'rgba(212,168,67,0.02)' }] } },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  }

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: templateRanking.map((t) => t.name) },
    yAxis: { type: 'value' as const },
    series: [{
      data: templateRanking.map((t) => t.usageCount),
      type: 'bar' as const,
      itemStyle: {
        color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#D4A843' }, { offset: 1, color: '#1E3A5F' }] },
        borderRadius: [4, 4, 0, 0],
      },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#1E3A5F] mb-6">仪表盘</h2>

      <div className="grid grid-cols-4 gap-5 mb-6">
        {statCards.map((card) => (
          <div key={card.key} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>{stats.byStatus[card.key]}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bgColor }}>
                <card.icon size={24} style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">合同总数</p>
          <p className="text-2xl font-bold text-[#1E3A5F]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">平均签署时长</p>
          <p className="text-2xl font-bold text-[#1E3A5F]">{stats.avgSigningDuration}<span className="text-sm font-normal text-gray-400 ml-1">天</span></p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">签署完成率</p>
          <p className="text-2xl font-bold text-[#2ECC71]">{stats.completionRate}<span className="text-sm font-normal text-gray-400 ml-1">%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-4">月度签署趋势</h3>
          <ReactECharts option={lineOption} style={{ height: 280 }} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-4">模板使用频率排名</h3>
          <ReactECharts option={barOption} style={{ height: 280 }} />
        </div>
      </div>
    </div>
  )
}
