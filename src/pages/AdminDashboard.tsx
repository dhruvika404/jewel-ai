import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import AdminHome from "./admin/Home";
import AdminClients from "./admin/Clients";
import SalesPersons from "./admin/SalesPersons";
import ClientDetails from "./admin/ClientDetails";
import Reports from "./admin/Reports";
import Followups from "./admin/Followups";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="sales-persons" element={<SalesPersons />} />
        <Route path="reports" element={<Reports />} />
        <Route path="followups" element={<Followups />} />
      </Routes>
    </AdminLayout>
  );
}
