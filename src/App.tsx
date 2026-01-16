import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import AdminRoutes from "./routes/AdminRoutes";
import SalesRoutes from "./routes/SalesRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { PageHeaderProvider } from "./contexts/PageHeaderProvider";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageHeaderProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="admin">
                  <AdminRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/*"
              element={
                <ProtectedRoute role="sales_executive">
                  <SalesRoutes />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </PageHeaderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
