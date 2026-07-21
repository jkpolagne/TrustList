import type { PlatformLogEntry } from "../types";

export const platformLogs: PlatformLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-01-05T09:00:00+08:00",
    eventType: "Firm Onboarded",
    firmId: "firm-advench",
    message: "Advench Realty onboarded onto the platform.",
  },
  {
    id: "log-2",
    timestamp: "2026-01-05T09:05:00+08:00",
    eventType: "Company Admin Created",
    firmId: "firm-advench",
    message: "Company Admin account created for Teresa Aquino.",
  },
  {
    id: "log-3",
    timestamp: "2026-02-10T09:00:00+08:00",
    eventType: "Firm Onboarded",
    firmId: "firm-bicolhomes",
    message: "Bicol Homes Realty onboarded onto the platform.",
  },
  {
    id: "log-4",
    timestamp: "2026-02-10T09:05:00+08:00",
    eventType: "Company Admin Created",
    firmId: "firm-bicolhomes",
    message: "Company Admin account created for Danilo Reyes.",
  },
  {
    id: "log-5",
    timestamp: "2026-03-01T09:00:00+08:00",
    eventType: "Firm Onboarded",
    firmId: "firm-coastline",
    message: "Coastline Properties onboarded onto the platform.",
  },
  {
    id: "log-6",
    timestamp: "2026-03-01T09:05:00+08:00",
    eventType: "Company Admin Created",
    firmId: "firm-coastline",
    message: "Company Admin account created for Marivic Ocampo.",
  },
  {
    id: "log-7",
    timestamp: "2026-05-12T14:30:00+08:00",
    eventType: "Firm Status Changed",
    firmId: "firm-coastline",
    message: "Coastline Properties suspended pending SEC compliance document renewal.",
  },
  {
    id: "log-8",
    timestamp: "2026-05-20T11:15:00+08:00",
    eventType: "Firm Status Changed",
    firmId: "firm-coastline",
    message: "Coastline Properties reactivated after compliance documents were submitted.",
  },
];
