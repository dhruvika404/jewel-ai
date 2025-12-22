import { Routes, Route } from 'react-router-dom'
import SalesLayout from '@/components/layouts/SalesLayout'
import SalesHome from './sales/Home'
import SalesLeads from './sales/Leads'
import SalesFollowups from './sales/Followups'

export default function SalesDashboard() {
  return (
    <SalesLayout>
      <Routes>
        <Route index element={<SalesHome />} />
        <Route path="leads" element={<SalesLeads />} />
        <Route path="followups" element={<SalesFollowups />} />
      </Routes>
    </SalesLayout>
  )
}
