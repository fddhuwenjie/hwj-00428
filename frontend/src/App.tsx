import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Contracts from '@/pages/Contracts'
import ContractForm from '@/pages/ContractForm'
import ContractDetail from '@/pages/ContractDetail'
import SigningPage from '@/pages/SigningPage'
import Templates from '@/pages/Templates'
import TemplateForm from '@/pages/TemplateForm'
import GenerateContract from '@/pages/GenerateContract'
import VerifyContract from '@/pages/VerifyContract'
import Reminders from '@/pages/Reminders'
import { ContractProvider } from '@/contexts/ContractContext'
import { SigningProvider } from '@/contexts/SigningContext'
import { UIProvider } from '@/contexts/UIContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import Toast from '@/components/Toast'
import { cancelAllRequests } from '@/api'

function RouteChangeHandler() {
  const location = useLocation()

  useEffect(() => {
    cancelAllRequests()
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <UIProvider>
        <ContractProvider>
          <SigningProvider>
            <Router>
              <RouteChangeHandler />
              <Toast />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/contracts/new" element={<ContractForm />} />
                  <Route path="/contracts/:id" element={<ContractDetail />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/templates/new" element={<TemplateForm />} />
                  <Route path="/templates/:id/generate" element={<GenerateContract />} />
                  <Route path="/reminders" element={<Reminders />} />
                </Route>
                <Route path="/signing/:contractId/:signerId" element={<SigningPage />} />
                <Route path="/verify" element={<VerifyContract />} />
              </Routes>
            </Router>
          </SigningProvider>
        </ContractProvider>
      </UIProvider>
    </ErrorBoundary>
  )
}
