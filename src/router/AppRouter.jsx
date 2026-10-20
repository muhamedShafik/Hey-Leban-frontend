// src/router/AppRouter.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import POSPage from "../pages/POSPage";
import OpenSalesPage from "../pages/OpenSalesPage";
import CloseSalesPage from "../pages/CloseSalesPage";
import OrdersPage from "../pages/OrdersPage";
import SettingsPage from "../pages/SettingsPage";
import PageLoader from "../components/ui/PageLoader";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import MenuManagementPage from "../pages/MenuManagementPage";
import { useAuthStore } from "../store/authStore";
import SummaryPage from "../pages/SummaryPage";
import SalesSessionsPage from "../pages/SalesSessionsPage";
import BusinessReportPage from "../pages/BusinessReportPage";
import InventoryPage from "../pages/InventoryPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuthStore();

  if (isAuthLoading) {
    return <div><PageLoader /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RootRedirect() {
  const { isAuthenticated, isAuthLoading } = useAuthStore();
  if (isAuthLoading) return <div><PageLoader /></div>;
  return <Navigate to={isAuthenticated ? "/pos" : "/login"} replace />;
}

// Prevent logged-in users from seeing the login page
function PublicRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuthStore();
  if (isAuthLoading) return <div><PageLoader /></div>;
  if (isAuthenticated) return <Navigate to="/pos" replace />;
  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:tokenParam" element={<ResetPasswordPage />} />


      <Route
        path="/open-sales"
        element={
          <ProtectedRoute>
            <OpenSalesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/close-sales"
        element={
          <ProtectedRoute>
            <CloseSalesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <POSPage />
          </ProtectedRoute>
        }
      />
       <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
       <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary"
        element={
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-sessions"
        element={
          <ProtectedRoute>
            <SalesSessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business-report"
        element={
          <ProtectedRoute>
            <BusinessReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/items"
        element={
          <ProtectedRoute>
            <MenuManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
       <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
  
    </Routes>
  );
}

export default AppRouter;