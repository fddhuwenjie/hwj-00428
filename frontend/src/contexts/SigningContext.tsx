import { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react'
import type { Reminder } from '@/types'

type SigningState = {
  reminders: Reminder[]
}

type SigningAction =
  | { type: 'SET_REMINDERS'; payload: Reminder[] }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'MARK_REMINDER_READ'; payload: string }

const initialState: SigningState = {
  reminders: [],
}

function signingReducer(state: SigningState, action: SigningAction): SigningState {
  switch (action.type) {
    case 'SET_REMINDERS':
      return { ...state, reminders: action.payload }
    case 'ADD_REMINDER':
      return { ...state, reminders: [action.payload, ...state.reminders] }
    case 'MARK_REMINDER_READ':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.payload ? { ...r, read: true } : r
        ),
      }
    default:
      return state
  }
}

interface SigningContextType extends SigningState {
  setReminders: (reminders: Reminder[]) => void
  addReminder: (reminder: Reminder) => void
  markReminderRead: (id: string) => void
  unreadReminderCount: () => number
}

const SigningContext = createContext<SigningContextType | undefined>(undefined)

export function SigningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(signingReducer, initialState)

  const setReminders = useCallback((reminders: Reminder[]) => {
    dispatch({ type: 'SET_REMINDERS', payload: reminders })
  }, [])

  const addReminder = useCallback((reminder: Reminder) => {
    dispatch({ type: 'ADD_REMINDER', payload: reminder })
  }, [])

  const markReminderRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_REMINDER_READ', payload: id })
  }, [])

  const unreadReminderCount = useCallback(() => {
    return state.reminders.filter((r) => !r.read).length
  }, [state.reminders])

  const value = useMemo(
    () => ({
      ...state,
      setReminders,
      addReminder,
      markReminderRead,
      unreadReminderCount,
    }),
    [state, setReminders, addReminder, markReminderRead, unreadReminderCount]
  )

  return (
    <SigningContext.Provider value={value}>
      {children}
    </SigningContext.Provider>
  )
}

export function useSigningContext() {
  const context = useContext(SigningContext)
  if (context === undefined) {
    throw new Error('useSigningContext must be used within a SigningProvider')
  }
  return context
}
