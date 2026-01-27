import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import Followups from "@/pages/Followups";
import SalesPersons from "@/pages/SalesPersons";
import Reports from "@/pages/Reports";

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="sales-persons" element={<SalesPersons />} />
        <Route path="reports" element={<Reports />} />
        <Route path="followups/:type" element={<Followups />} />
        <Route
          path="followups"
          element={<Navigate to="followups/new-order" replace />}
        />
      </Routes>
    </AdminLayout>
  );
}
