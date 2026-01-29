import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import AdminRoutes from "./routes/AdminRoutes";
import SalesRoutes from "./routes/SalesRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PageHeaderProvider } from "./contexts/PageHeaderProvider";

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
        <PageHeaderProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
