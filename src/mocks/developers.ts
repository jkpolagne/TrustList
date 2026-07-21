import type { Developer } from "../types";

export const developers: Developer[] = [
  {
    id: "dev-goldenhorizon",
    companyId: "firm-advench",
    name: "Golden Horizon Developers",
    commissionRates: {
      direct: { broker: 2, salesManager: 4, salesPerson: 0 },
      referred: { broker: 2, salesManager: 1.5, salesPerson: 2.5 },
    },
  },
  {
    id: "dev-meridian",
    companyId: "firm-bicolhomes",
    name: "Meridian Land Ventures",
    commissionRates: {
      direct: { broker: 2.5, salesManager: 4.5, salesPerson: 0 },
      referred: { broker: 2.5, salesManager: 2, salesPerson: 2.5 },
    },
  },
  {
    id: "dev-everstone",
    companyId: "firm-coastline",
    name: "Everstone Bay Developers",
    commissionRates: {
      direct: { broker: 3, salesManager: 3.5, salesPerson: 0 },
      referred: { broker: 3, salesManager: 1, salesPerson: 2.5 },
    },
  },
];
