import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./pages/OwnerDashboard";

import UserDetailsPage from "./pages/UserDetailsPage";
import UsersListPage from "./pages/UsersListPage";
import { isAdminLoggedIn } from "./utils/auth";

export default function MainRouter() {
  return (
    <HashRouter>
      <Routes>
        {/* Login Page */}
        <Route
          path="/login"
          element={
            isAdminLoggedIn() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={() => window.location.reload()} />
            )
          }
        />

        {/* Staff / RFID Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* Owner Dashboard */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* All Users List Page */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersListPage />
            </ProtectedRoute>
          }
        />

        {/* User Details Page */}
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Default - Redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}