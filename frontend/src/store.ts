import { create } from 'zustand'
import type { Contract, Template, Reminder, DashboardStats, TrendItem, TemplateRankingItem } from './types'

interface AppState {
  contracts: Contract[]
  templates: Template[]
  reminders: Reminder[]
  dashboardStats: DashboardStats | null
  trendData: TrendItem[]
  templateRanking: TemplateRankingItem[]
  loading: boolean
  setContracts: (contracts: Contract[]) => void
  setTemplates: (templates: Template[]) => void
  setReminders: (reminders: Reminder[]) => void
  setDashboardStats: (stats: DashboardStats) => void
  setTrendData: (data: TrendItem[]) => void
  setTemplateRanking: (data: TemplateRankingItem[]) => void
  setLoading: (loading: boolean) => void
  addContract: (contract: Contract) => void
  updateContract: (id: string, data: Partial<Contract>) => void
  removeContract: (id: string) => void
  addTemplate: (template: Template) => void
  updateTemplate: (id: string, data: Partial<Template>) => void
  removeTemplate: (id: string) => void
  markReminderRead: (id: string) => void
  unreadReminderCount: () => number
}

export const useStore = create<AppState>((set, get) => ({
  contracts: [],
  templates: [],
  reminders: [],
  dashboardStats: null,
  trendData: [],
  templateRanking: [],
  loading: false,

  setContracts: (contracts) => set({ contracts }),
  setTemplates: (templates) => set({ templates }),
  setReminders: (reminders) => set({ reminders }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setTrendData: (trendData) => set({ trendData }),
  setTemplateRanking: (templateRanking) => set({ templateRanking }),
  setLoading: (loading) => set({ loading }),

  addContract: (contract) => set((s) => ({ contracts: [...s.contracts, contract] })),
  updateContract: (id, data) =>
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeContract: (id) => set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) })),

  addTemplate: (template) => set((s) => ({ templates: [...s.templates, template] })),
  updateTemplate: (id, data) =>
    set((s) => ({
      templates: s.templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

  markReminderRead: (id) =>
    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, read: true } : r)),
    })),

  unreadReminderCount: () => get().reminders.filter((r) => !r.read).length,
}))
