import { Routes, Route, Navigate } from "react-router-dom";
import SalesLayout from "@/components/layouts/SalesLayout";
import SalesHome from "./admin/Home";
import AdminClients from "./admin/Clients";
import ClientDetails from "./admin/ClientDetails";
import Reports from "./admin/Reports";
import Followups from "./admin/Followups";

export default function SalesDashboard() {
  return (
    <SalesLayout>
      <Routes>
        <Route index element={<SalesHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="followups/:type" element={<Followups />} />
        <Route path="followups" element={<Navigate to="followups/new-order" replace />} />
      </Routes>
    </SalesLayout>
  );
}
