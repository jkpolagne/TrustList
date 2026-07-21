import type { CompanyAdminAccount } from "../types";

export const companyAdmins: CompanyAdminAccount[] = [
  {
    id: "admin-aquino",
    firmId: "firm-advench",
    name: "Teresa Aquino",
    email: "teresa.aquino@advenchrealty.ph",
    temporaryPassword: "Adv-Temp-2026!",
    createdAt: "2026-01-05T09:00:00+08:00",
  },
  {
    id: "admin-reyes",
    firmId: "firm-bicolhomes",
    name: "Danilo Reyes",
    email: "danilo.reyes@bicolhomesrealty.ph",
    temporaryPassword: "Bhr-Temp-2026!",
    createdAt: "2026-02-10T09:00:00+08:00",
  },
  {
    id: "admin-ocampo",
    firmId: "firm-coastline",
    name: "Marivic Ocampo",
    email: "marivic.ocampo@coastlineproperties.ph",
    temporaryPassword: "Cst-Temp-2026!",
    createdAt: "2026-03-01T09:00:00+08:00",
  },
];
