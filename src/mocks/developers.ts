import type { Developer } from "../types";

export const developers: Developer[] = [
  {
    id: "dev-goldenhorizon",
    companyId: "firm-advench",
    name: "Golden Horizon Developers",
    status: "Active",
    totalCutPercent: 8,
    commissionRates: {
      direct: { broker: 2, salesManager: 6, salesPerson: 0 },
      referred: { broker: 2, salesManager: 2, salesPerson: 4 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 25, bank: 25 },
    establishedYear: 2005,
    dhsudLicenseNumber: "DHSUD-BIC-2005-00147",
    dhsudLicenseStatus: "Active",
    totalProjectsCompleted: 12,
    about:
      "One of Bicol's most established residential developers, known for master-planned subdivisions across Camarines Sur since the mid-2000s.",
  },
  {
    id: "dev-riverstone",
    companyId: "firm-advench",
    name: "Riverstone Heights Corp",
    status: "Inactive",
    totalCutPercent: 5,
    commissionRates: {
      direct: { broker: 1.5, salesManager: 3.5, salesPerson: 0 },
      referred: { broker: 1.5, salesManager: 1, salesPerson: 2 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 25, bank: 25 },
    establishedYear: 2015,
    dhsudLicenseNumber: "DHSUD-BIC-2015-00398",
    dhsudLicenseStatus: "Expired",
    totalProjectsCompleted: 3,
    about:
      "A smaller regional developer specializing in lot-only subdivisions in Pili; license renewal is currently pending with DHSUD.",
  },
  {
    id: "dev-meridian",
    companyId: "firm-bicolhomes",
    name: "Meridian Land Ventures",
    status: "Active",
    totalCutPercent: 7,
    commissionRates: {
      direct: { broker: 2.5, salesManager: 4.5, salesPerson: 0 },
      referred: { broker: 2.5, salesManager: 2, salesPerson: 2.5 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 25, bank: 30 },
    establishedYear: 2010,
    dhsudLicenseNumber: "DHSUD-BIC-2010-00256",
    dhsudLicenseStatus: "Active",
    totalProjectsCompleted: 7,
    about:
      "A mid-sized developer active in Naga City's outskirts, focused on affordable townhome communities for young families.",
  },
  {
    id: "dev-everstone",
    companyId: "firm-coastline",
    name: "Everstone Bay Developers",
    status: "Active",
    totalCutPercent: 6.5,
    commissionRates: {
      direct: { broker: 3, salesManager: 3.5, salesPerson: 0 },
      referred: { broker: 3, salesManager: 1, salesPerson: 2.5 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 20, bank: 25 },
    establishedYear: 2012,
    dhsudLicenseNumber: "",
    dhsudLicenseStatus: "Not Available",
    totalProjectsCompleted: 5,
    about:
      "A coastal-focused developer building along Legazpi's Albay Gulf frontage; DHSUD license documentation has not yet been submitted to the platform.",
  },
];
