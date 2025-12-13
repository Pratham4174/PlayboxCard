import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";


import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
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
              <Login onLogin={() => {}} />
            )
          }
        />

        {/* Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
      </HashRouter>
  );
}
