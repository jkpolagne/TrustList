import type { Firm } from "../types";

export const firms: Firm[] = [
  {
    id: "firm-advench",
    code: "ADV",
    name: "Advench Realty",
    city: "Naga City",
    address: "2F Alano Building, Magsaysay Avenue, Naga City",
    email: "info@advenchrealty.ph",
    contactNumber: "054-472-1010",
    isPrimary: true,
    status: "Active",
  },
  {
    id: "firm-bicolhomes",
    code: "BHR",
    name: "Bicol Homes Realty",
    city: "Naga City",
    address: "Unit 4, CBD Plaza, Naga City",
    email: "info@bicolhomesrealty.ph",
    contactNumber: "054-472-2020",
    status: "Active",
  },
  {
    id: "firm-coastline",
    code: "CST",
    name: "Coastline Properties",
    city: "Legazpi City",
    address: "Rizal Street, Legazpi City",
    email: "info@coastlineproperties.ph",
    contactNumber: "052-480-3030",
    status: "Active",
  },
];
