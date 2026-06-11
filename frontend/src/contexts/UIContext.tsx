import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react'

type UIState = {
  loading: boolean
  error: string | null
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
}

type UIAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } | null }
  | { type: 'SHOW_TOAST'; payload: { message: string; type?: 'success' | 'error' | 'info' } }

const initialState: UIState = {
  loading: false,
  error: null,
  toast: null,
}

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_TOAST':
      return { ...state, toast: action.payload }
    case 'SHOW_TOAST':
      return {
        ...state,
        toast: {
          message: action.payload.message,
          type: action.payload.type || 'info',
        },
      }
    default:
      return state
  }
}

interface UIContextType extends UIState {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  showError: (message: string) => void
  showSuccess: (message: string) => void
  clearToast: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState)

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } })
  }, [])

  const showError = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type: 'error' } })
  }, [])

  const showSuccess = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type: 'success' } })
  }, [])

  const clearToast = useCallback(() => {
    dispatch({ type: 'SET_TOAST', payload: null })
  }, [])

  useEffect(() => {
    ;(window as any).__toastError = showError
    return () => {
      delete (window as any).__toastError
    }
  }, [showError])

  return (
    <UIContext.Provider
      value={{
        ...state,
        setLoading,
        setError,
        showToast,
        showError,
        showSuccess,
        clearToast,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUIContext() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider')
  }
  return context
}
