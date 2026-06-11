import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import type { Contract, Template, Reminder, DashboardStats, SigningFlow, TrendItem, TemplateRankingItem, Signer, ContractVersion, AuditLogEntry } from './types'

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

const pendingRequests = new Map<string, AbortController>()

function generateRequestKey(config: AxiosRequestConfig): string {
  return `${config.method}-${config.url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const controller = new AbortController()
    const requestKey = generateRequestKey(config)
    ;(config as any).requestKey = requestKey
    pendingRequests.set(requestKey, controller)
    config.signal = controller.signal

    config.headers['X-Request-Timestamp'] = Date.now().toString()

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (res) => {
    const requestKey = (res.config as any).requestKey
    if (requestKey) {
      pendingRequests.delete(requestKey)
    }
    return res.data
  },
  async (error: AxiosError) => {
    const config = error.config as any
    const requestKey = config?.requestKey

    if (requestKey) {
      pendingRequests.delete(requestKey)
    }

    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(new Error('请求已取消'))
    }

    if (config && !config._retryCount) {
      config._retryCount = 0
    }

    const isNetworkError = error.code === 'ERR_NETWORK' || !error.response
    const shouldRetry = isNetworkError && config && config._retryCount < MAX_RETRIES

    if (shouldRetry) {
      config._retryCount += 1
      await sleep(RETRY_DELAY)
      return api(config)
    }

    const msg = (error.response?.data as any)?.message || error.message || '请求失败'

    if (typeof window !== 'undefined' && (window as any).__toastError) {
      (window as any).__toastError(msg)
    }

    return Promise.reject(new Error(msg))
  }
)

export function cancelAllRequests(): void {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}

export function createRequestGroup() {
  const requestKeys: string[] = []

  const trackRequest = <T>(promise: Promise<T>, key: string): Promise<T> => {
    requestKeys.push(key)
    return promise
  }

  const cancelAll = () => {
    requestKeys.forEach((key) => {
      const controller = pendingRequests.get(key)
      if (controller) {
        controller.abort()
        pendingRequests.delete(key)
      }
    })
    requestKeys.length = 0
  }

  return { trackRequest, cancelAll }
}

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
  getVersions: (id: string) => api.get(`/contracts/${id}/versions`) as Promise<ContractVersion[]>,
  getVersion: (id: string, version: string) => api.get(`/contracts/${id}/versions/${version}`) as Promise<ContractVersion>,
  rollbackToVersion: (id: string, version: string) => api.post(`/contracts/${id}/versions/${version}/rollback`) as Promise<Contract>,
  getAuditLog: (id: string) => api.get(`/contracts/${id}/audit-log`) as Promise<AuditLogEntry[]>,
  batchSign: (data: { contractIds: string[]; signers: { name: string; email: string }[]; mode: 'sequential' | 'parallel' }) =>
    api.post('/contracts/batch-sign', data) as Promise<{ success: string[]; failed: { id: string; reason: string }[] }>,
}

export const signingApi = {
  sign: (signerId: string, data: { signatureImage: string }) => api.post(`/signing/${signerId}/sign`, data) as Promise<Contract>,
  reject: (signerId: string, data: { reason: string }) => api.post(`/signing/${signerId}/reject`, data) as Promise<Contract>,
  getSigner: (signerId: string) => api.get(`/signing/${signerId}`) as Promise<{ signer: Signer; contract: Contract }>,
  delegate: (signerId: string, data: { delegateName: string; delegateEmail: string }) =>
    api.post(`/signing/${signerId}/delegate`, data) as Promise<{ success: boolean; message: string; newSignerId: string; contract: Contract }>,
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
