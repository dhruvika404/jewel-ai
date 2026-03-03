import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import AdminRoutes from "./routes/AdminRoutes";
import SalesRoutes from "./routes/SalesRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PageHeaderProvider } from "./contexts/PageHeaderProvider";
import { SocketProvider } from "./contexts/SocketContext";

function RoleBasedRoutes() {
  const { user } = useAuth();

  if (user?.role === "sales_executive") {
    return <SalesRoutes />;
  }

  return <AdminRoutes />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <PageHeaderProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <RoleBasedRoutes />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster closeButton />
          </PageHeaderProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

