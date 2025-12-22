import { Routes, Route } from 'react-router-dom'
import AdminLayout from '@/components/layouts/AdminLayout'
import AdminHome from './admin/Home'
import AdminClients from './admin/Clients'
import AdminFollowups from './admin/Followups'
import AdminSettings from './admin/Settings'

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="followups" element={<AdminFollowups />} />
        <Route path="settings" element={<AdminSettings />} />
      </Routes>
    </AdminLayout>
  )
}
