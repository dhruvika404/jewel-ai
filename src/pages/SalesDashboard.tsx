import { Routes, Route } from "react-router-dom";
import SalesLayout from "@/components/layouts/SalesLayout";
import SalesHome from "./sales/Home";

export default function SalesDashboard() {
  return (
    <SalesLayout>
      <Routes>
        <Route index element={<SalesHome />} />
      </Routes>
    </SalesLayout>
  );
}
