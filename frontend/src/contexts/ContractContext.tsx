import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import type { Contract, Template, DashboardStats, TrendItem, TemplateRankingItem } from '@/types'

type ContractState = {
  contracts: Contract[]
  templates: Template[]
  dashboardStats: DashboardStats | null
  trendData: TrendItem[]
  templateRanking: TemplateRankingItem[]
}

type ContractAction =
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'ADD_CONTRACT'; payload: Contract }
  | { type: 'UPDATE_CONTRACT'; payload: { id: string; data: Partial<Contract> } }
  | { type: 'REMOVE_CONTRACT'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: Template[] }
  | { type: 'ADD_TEMPLATE'; payload: Template }
  | { type: 'UPDATE_TEMPLATE'; payload: { id: string; data: Partial<Template> } }
  | { type: 'REMOVE_TEMPLATE'; payload: string }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'SET_TREND_DATA'; payload: TrendItem[] }
  | { type: 'SET_TEMPLATE_RANKING'; payload: TemplateRankingItem[] }

const initialState: ContractState = {
  contracts: [],
  templates: [],
  dashboardStats: null,
  trendData: [],
  templateRanking: [],
}

function contractReducer(state: ContractState, action: ContractAction): ContractState {
  switch (action.type) {
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload }
    case 'ADD_CONTRACT':
      return { ...state, contracts: [...state.contracts, action.payload] }
    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c
        ),
      }
    case 'REMOVE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter((c) => c.id !== action.payload),
      }
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload }
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] }
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.data } : t
        ),
      }
    case 'REMOVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      }
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload }
    case 'SET_TREND_DATA':
      return { ...state, trendData: action.payload }
    case 'SET_TEMPLATE_RANKING':
      return { ...state, templateRanking: action.payload }
    default:
      return state
  }
}

interface ContractContextType extends ContractState {
  setContracts: (contracts: Contract[]) => void
  addContract: (contract: Contract) => void
  updateContract: (id: string, data: Partial<Contract>) => void
  removeContract: (id: string) => void
  setTemplates: (templates: Template[]) => void
  addTemplate: (template: Template) => void
  updateTemplate: (id: string, data: Partial<Template>) => void
  removeTemplate: (id: string) => void
  setDashboardStats: (stats: DashboardStats) => void
  setTrendData: (data: TrendItem[]) => void
  setTemplateRanking: (data: TemplateRankingItem[]) => void
}

const ContractContext = createContext<ContractContextType | undefined>(undefined)

export function ContractProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contractReducer, initialState)

  const setContracts = useCallback((contracts: Contract[]) => {
    dispatch({ type: 'SET_CONTRACTS', payload: contracts })
  }, [])

  const addContract = useCallback((contract: Contract) => {
    dispatch({ type: 'ADD_CONTRACT', payload: contract })
  }, [])

  const updateContract = useCallback((id: string, data: Partial<Contract>) => {
    dispatch({ type: 'UPDATE_CONTRACT', payload: { id, data } })
  }, [])

  const removeContract = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CONTRACT', payload: id })
  }, [])

  const setTemplates = useCallback((templates: Template[]) => {
    dispatch({ type: 'SET_TEMPLATES', payload: templates })
  }, [])

  const addTemplate = useCallback((template: Template) => {
    dispatch({ type: 'ADD_TEMPLATE', payload: template })
  }, [])

  const updateTemplate = useCallback((id: string, data: Partial<Template>) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: { id, data } })
  }, [])

  const removeTemplate = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TEMPLATE', payload: id })
  }, [])

  const setDashboardStats = useCallback((stats: DashboardStats) => {
    dispatch({ type: 'SET_DASHBOARD_STATS', payload: stats })
  }, [])

  const setTrendData = useCallback((data: TrendItem[]) => {
    dispatch({ type: 'SET_TREND_DATA', payload: data })
  }, [])

  const setTemplateRanking = useCallback((data: TemplateRankingItem[]) => {
    dispatch({ type: 'SET_TEMPLATE_RANKING', payload: data })
  }, [])

  return (
    <ContractContext.Provider
      value={{
        ...state,
        setContracts,
        addContract,
        updateContract,
        removeContract,
        setTemplates,
        addTemplate,
        updateTemplate,
        removeTemplate,
        setDashboardStats,
        setTrendData,
        setTemplateRanking,
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}

export function useContractContext() {
  const context = useContext(ContractContext)
  if (context === undefined) {
    throw new Error('useContractContext must be used within a ContractProvider')
  }
  return context
}
