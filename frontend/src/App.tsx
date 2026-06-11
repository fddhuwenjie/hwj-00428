import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <Router>
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
  )
}
