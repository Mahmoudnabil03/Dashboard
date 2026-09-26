import React, { createContext, useContext, useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Posts = lazy(() => import("./pages/Posts"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Comments = lazy(() => import("./pages/Comments"));
const Accounts = lazy(() => import("./pages/Accounts"));
const AIAgent = lazy(() => import("./pages/AIAgent"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Settings = lazy(() => import("./pages/Settings"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Content = lazy(() => import("./pages/Content"));
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const Billing = lazy(() => import("./pages/Billing"));
const Leads = lazy(() => import("./pages/Leads"));
const Properties = lazy(() => import("./pages/Properties"));
const Websites = lazy(() => import("./pages/Websites"));
const Legal = lazy(() => import("./pages/Legal"));

const queryClient = new QueryClient();

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const isAuthenticated = !!token;

  const login = (newToken, user) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label="Loading page">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            <Toaster position="top-right" />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/terms" element={<Legal page="terms" />} />
                <Route path="/privacy" element={<Legal page="privacy" />} />
                <Route path="/cookies" element={<Legal page="cookies" />} />
                <Route path="/compliance" element={<Legal page="compliance" />} />
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<Login />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="posts" element={<Posts />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="comments" element={<Comments />} />
                    <Route path="inbox" element={<Inbox />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="ai-agent" element={<AIAgent />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="content" element={<Content />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="team" element={<Team />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="properties" element={<Properties />} />
                    <Route path="websites" element={<Websites />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
