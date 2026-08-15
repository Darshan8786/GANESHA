import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/guards";
import { ToastProvider } from "./lib/toast";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Collection from "./pages/Collection";
import History from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Collection />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}