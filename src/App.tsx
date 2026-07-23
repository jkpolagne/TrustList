import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PublicShell } from "./components/PublicShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import { ReferralProvider } from "./context/ReferralContext";
import type { InternalRole } from "./types";
import { AllVouchers } from "./pages/AllVouchers";
import { Browse } from "./pages/Browse";
import { ClientDetail } from "./pages/ClientDetail";
import { Compare } from "./pages/Compare";
import { ConsultantAccounts } from "./pages/ConsultantAccounts";
import { ConsultantLinks } from "./pages/ConsultantLinks";
import { CreateVoucher } from "./pages/CreateVoucher";
import { Dashboard } from "./pages/Dashboard";
import { ExpectedPayouts } from "./pages/ExpectedPayouts";
import { Firms } from "./pages/Firms";
import { Landing } from "./pages/Landing";
import { ListingVerification } from "./pages/ListingVerification";
import { LoanCalculator } from "./pages/LoanCalculator";
import { Login } from "./pages/Login";
import { ManageDevelopers } from "./pages/ManageDevelopers";
import { ManageLoanQuotations } from "./pages/ManageLoanQuotations";
import { ManageProperties } from "./pages/ManageProperties";
import { ManageVisitSchedules } from "./pages/ManageVisitSchedules";
import { MonitorClients } from "./pages/MonitorClients";
import { MyCommission } from "./pages/MyCommission";
import { PlatformLogs } from "./pages/PlatformLogs";
import { PropertyDetails } from "./pages/PropertyDetails";
import { PropertyValuation } from "./pages/PropertyValuation";
import { SalesPersons } from "./pages/SalesPersons";
import { ScheduleVisit } from "./pages/ScheduleVisit";
import { SellerInquiries } from "./pages/SellerInquiries";
import { SellerInquiryDetail } from "./pages/SellerInquiryDetail";
import { SellProperty } from "./pages/SellProperty";
import { TeamOverview } from "./pages/TeamOverview";
import { UploadPaymentProof } from "./pages/UploadPaymentProof";
import { VoucherDetail } from "./pages/VoucherDetail";

function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: InternalRole[]; children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (!roles.includes(session.role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/properties/:id/visit" element={<ScheduleVisit />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/loan-calculator" element={<LoanCalculator />} />
        <Route path="/property-valuation" element={<PropertyValuation />} />
        <Route path="/sell" element={<SellProperty />} />
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

        <Route
          path="firms"
          element={
            <RequireRole roles={["Super Admin"]}>
              <Firms />
            </RequireRole>
          }
        />
        <Route
          path="logs"
          element={
            <RequireRole roles={["Super Admin"]}>
              <PlatformLogs />
            </RequireRole>
          }
        />

        <Route
          path="developers"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ManageDevelopers />
            </RequireRole>
          }
        />
        <Route
          path="properties"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ManageProperties />
            </RequireRole>
          }
        />
        <Route
          path="loan-quotations"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ManageLoanQuotations />
            </RequireRole>
          }
        />
        <Route
          path="visits"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ManageVisitSchedules />
            </RequireRole>
          }
        />
        <Route
          path="consultants"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ConsultantAccounts />
            </RequireRole>
          }
        />
        <Route
          path="consultant-links"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ConsultantLinks />
            </RequireRole>
          }
        />
        <Route
          path="seller-inquiries"
          element={
            <RequireRole roles={["Company Admin"]}>
              <SellerInquiries />
            </RequireRole>
          }
        />
        <Route
          path="seller-inquiries/:id"
          element={
            <RequireRole roles={["Company Admin"]}>
              <SellerInquiryDetail />
            </RequireRole>
          }
        />
        <Route
          path="listing-verification"
          element={
            <RequireRole roles={["Company Admin"]}>
              <ListingVerification />
            </RequireRole>
          }
        />

        <Route
          path="clients"
          element={
            <RequireRole roles={["Sales Manager", "Sales Person"]}>
              <MonitorClients />
            </RequireRole>
          }
        />
        <Route
          path="clients/:id"
          element={
            <RequireRole roles={["Sales Manager", "Sales Person"]}>
              <ClientDetail />
            </RequireRole>
          }
        />
        <Route
          path="payment-proof"
          element={
            <RequireRole roles={["Sales Manager", "Sales Person"]}>
              <UploadPaymentProof />
            </RequireRole>
          }
        />
        <Route
          path="team"
          element={
            <RequireRole roles={["Sales Manager"]}>
              <SalesPersons />
            </RequireRole>
          }
        />

        <Route
          path="vouchers"
          element={
            <RequireRole roles={["Broker"]}>
              <AllVouchers />
            </RequireRole>
          }
        />
        <Route
          path="vouchers/new"
          element={
            <RequireRole roles={["Broker"]}>
              <CreateVoucher />
            </RequireRole>
          }
        />
        <Route
          path="vouchers/:id"
          element={
            <RequireRole roles={["Broker", "Sales Manager", "Sales Person"]}>
              <VoucherDetail />
            </RequireRole>
          }
        />
        <Route
          path="payouts"
          element={
            <RequireRole roles={["Broker"]}>
              <ExpectedPayouts />
            </RequireRole>
          }
        />
        <Route
          path="team-overview"
          element={
            <RequireRole roles={["Broker"]}>
              <TeamOverview />
            </RequireRole>
          }
        />
        <Route
          path="commission"
          element={
            <RequireRole roles={["Sales Manager", "Sales Person"]}>
              <MyCommission />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompareProvider>
        <ReferralProvider>
          <AppRoutes />
        </ReferralProvider>
      </CompareProvider>
    </AuthProvider>
  );
}

export default App;
