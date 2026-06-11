import axios from 'axios'
import type { Contract, Template, Reminder, DashboardStats, SigningFlow, TrendItem, TemplateRankingItem, Signer } from './types'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export const contractApi = {
  list: (params?: { status?: string }) => api.get('/contracts', { params }) as Promise<Contract[]>,
  get: (id: string) => api.get(`/contracts/${id}`) as Promise<Contract>,
  create: (data: { title: string; content: string; templateId?: string; variables?: Record<string, string>; deadline?: string }) => api.post('/contracts', data) as Promise<Contract>,
  update: (id: string, data: Partial<Contract>) => api.put(`/contracts/${id}`, data) as Promise<Contract>,
  delete: (id: string) => api.delete(`/contracts/${id}`) as Promise<{ message: string }>,
  verify: (code: string) => api.get(`/contracts/verify/${code}`) as Promise<Contract>,
  createSigning: (id: string, data: { signers: { name: string; email: string }[]; mode: 'sequential' | 'parallel' }) => api.post(`/contracts/${id}/signing`, data) as Promise<Contract>,
  getSigning: (id: string) => api.get(`/contracts/${id}/signing`) as Promise<SigningFlow>,
  remind: (id: string) => api.post(`/contracts/${id}/remind`) as Promise<Reminder[]>,
}

export const signingApi = {
  sign: (signerId: string, data: { signatureImage: string }) => api.post(`/signing/${signerId}/sign`, data) as Promise<Contract>,
  reject: (signerId: string, data: { reason: string }) => api.post(`/signing/${signerId}/reject`, data) as Promise<Contract>,
  getSigner: (signerId: string) => api.get(`/signing/${signerId}`) as Promise<{ signer: Signer; contract: Contract }>,
}

export const templateApi = {
  list: () => api.get('/templates') as Promise<Template[]>,
  get: (id: string) => api.get(`/templates/${id}`) as Promise<Template>,
  create: (data: Partial<Template>) => api.post('/templates', data) as Promise<Template>,
  update: (id: string, data: Partial<Template>) => api.put(`/templates/${id}`, data) as Promise<Template>,
  delete: (id: string) => api.delete(`/templates/${id}`) as Promise<{ message: string }>,
  generate: (id: string, data: { title: string; variables: Record<string, string>; deadline?: string }) => api.post(`/templates/${id}/generate`, data) as Promise<Contract>,
}

export const reminderApi = {
  list: () => api.get('/reminders') as Promise<Reminder[]>,
  expiring: () => api.get('/reminders/expiring') as Promise<Contract[]>,
  markRead: (id: string) => api.put(`/reminders/${id}/read`) as Promise<Reminder>,
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard') as Promise<DashboardStats>,
  trend: () => api.get('/stats/trend') as Promise<TrendItem[]>,
  templateRanking: () => api.get('/stats/template-ranking') as Promise<TemplateRankingItem[]>,
}

export default api
