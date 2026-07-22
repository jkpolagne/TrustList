import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  Calculator,
  Clock3,
  FileCheck2,
  Home,
  Inbox,
  LayoutDashboard,
  Link2,
  ShieldQuestion,
  UploadCloud,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { InternalRole } from "../types";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Not yet built — later modules. */
  comingSoon?: boolean;
}

export const NAV_ITEMS_BY_ROLE: Record<InternalRole, NavItem[]> = {
  "Super Admin": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "Firms", icon: Building2, path: "/app/firms" },
    { label: "Platform Logs", icon: Inbox, path: "/app/logs" },
  ],
  "Company Admin": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "Developers", icon: Building2, path: "/app/developers" },
    { label: "Properties", icon: Home, path: "/app/properties" },
    { label: "Loan Quotations", icon: Calculator, path: "/app/loan-quotations" },
    { label: "Visit Schedules", icon: CalendarClock, path: "/app/visits" },
    { label: "Consultants", icon: Users, path: "/app/consultants" },
    { label: "Consultant Links", icon: Link2, path: "/app/consultant-links" },
    { label: "Seller Inquiries", icon: Inbox, path: "/app/seller-inquiries" },
    {
      label: "Listing Verification",
      icon: ShieldQuestion,
      path: "/app/listing-verification",
    },
  ],
  Broker: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "All Vouchers", icon: FileCheck2, path: "/app/vouchers" },
    { label: "Expected Payouts", icon: Clock3, path: "/app/payouts" },
    { label: "Team Overview", icon: UserCheck, path: "/app/team-overview" },
  ],
  "Sales Manager": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "My Team", icon: Users, path: "/app/team" },
    { label: "My Clients", icon: UserCheck, path: "/app/clients" },
    { label: "Upload Payment Proof", icon: UploadCloud, path: "/app/payment-proof" },
    { label: "My Commission", icon: Wallet, path: "/app/commission" },
  ],
  "Sales Person": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "My Clients", icon: UserCheck, path: "/app/clients" },
    { label: "Upload Payment Proof", icon: UploadCloud, path: "/app/payment-proof" },
    { label: "My Commission", icon: Wallet, path: "/app/commission" },
  ],
};
