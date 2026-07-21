import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PublicShell } from "./components/PublicShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import { Browse } from "./pages/Browse";
import { Compare } from "./pages/Compare";
import { Dashboard } from "./pages/Dashboard";
import { LoanCalculator } from "./pages/LoanCalculator";
import { Login } from "./pages/Login";
import { PropertyDetails } from "./pages/PropertyDetails";
import { ScheduleVisit } from "./pages/ScheduleVisit";

function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Browse />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/properties/:id/visit" element={<ScheduleVisit />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/loan-calculator" element={<LoanCalculator />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RequireSession>
            <AppShell />
          </RequireSession>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompareProvider>
        <AppRoutes />
      </CompareProvider>
    </AuthProvider>
  );
}

export default App;
