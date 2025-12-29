import { Routes, Route } from 'react-router-dom'
import AdminLayout from '@/components/layouts/AdminLayout'
import AdminHome from './admin/Home'
import AdminClients from './admin/Clients'

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
      </Routes>
    </AdminLayout>
  )
}
