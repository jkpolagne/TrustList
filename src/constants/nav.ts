import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Building2,
  CalendarClock,
  Calculator,
  Clock3,
  FileCheck2,
  Home,
  Inbox,
  LayoutDashboard,
  ShieldQuestion,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { InternalRole } from "../types";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Only "Dashboard" is a real route in this stage; the rest preview upcoming modules. */
  comingSoon?: boolean;
}

export const NAV_ITEMS_BY_ROLE: Record<InternalRole, NavItem[]> = {
  "Super Admin": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "Firms", icon: Building2, path: "/app/firms", comingSoon: true },
    { label: "Platform Logs", icon: Inbox, path: "/app/logs", comingSoon: true },
  ],
  "Company Admin": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "Developers", icon: Building2, path: "/app/developers", comingSoon: true },
    { label: "Properties", icon: Home, path: "/app/properties", comingSoon: true },
    { label: "Loan Quotations", icon: Calculator, path: "/app/loan-quotations", comingSoon: true },
    { label: "Visit Schedules", icon: CalendarClock, path: "/app/visits", comingSoon: true },
    { label: "Consultants", icon: Users, path: "/app/consultants", comingSoon: true },
    { label: "Seller Inquiries", icon: Inbox, path: "/app/seller-inquiries" },
    {
      label: "Listing Verification",
      icon: ShieldQuestion,
      path: "/app/listing-verification",
    },
  ],
  Broker: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "Vouchers", icon: FileCheck2, path: "/app/vouchers", comingSoon: true },
    { label: "Check Prep & Release", icon: Banknote, path: "/app/checks", comingSoon: true },
    { label: "Expected Payouts", icon: Clock3, path: "/app/payouts", comingSoon: true },
    { label: "Team Monitoring", icon: UserCheck, path: "/app/team", comingSoon: true },
  ],
  "Sales Manager": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "My Team", icon: Users, path: "/app/team", comingSoon: true },
    { label: "My Clients", icon: UserCheck, path: "/app/clients", comingSoon: true },
    { label: "My Commission", icon: Wallet, path: "/app/commission", comingSoon: true },
  ],
  "Sales Person": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
    { label: "My Clients", icon: UserCheck, path: "/app/clients", comingSoon: true },
    { label: "My Commission", icon: Wallet, path: "/app/commission", comingSoon: true },
  ],
};
