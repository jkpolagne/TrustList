import type { Developer } from "../types";

export const developers: Developer[] = [
  {
    id: "dev-goldenhorizon",
    companyId: "firm-advench",
    name: "Golden Horizon Developers",
    status: "Active",
    totalCutPercent: 6,
    commissionRates: {
      direct: { broker: 2, salesManager: 4, salesPerson: 0 },
      referred: { broker: 2, salesManager: 1.5, salesPerson: 2.5 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 25, bank: 25 },
  },
  {
    id: "dev-riverstone",
    companyId: "firm-advench",
    name: "Riverstone Heights Corp",
    status: "Inactive",
    totalCutPercent: 6,
    commissionRates: {
      direct: { broker: 2, salesManager: 4, salesPerson: 0 },
      referred: { broker: 2, salesManager: 1.5, salesPerson: 2.5 },
    },
    requiredMilestonePercent: { cash: 100, inHouse: 25, bank: 25 },
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
  },
];
