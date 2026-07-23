import type { LocationZonalValue } from "../types";

/** Mock BIR zonal values, PHP per sqm, at barangay granularity — realistic relative
 * figures for Naga City/Pili/Legazpi City, not actual BIR schedule data. */
export const locations: LocationZonalValue[] = [
  { city: "Naga City", barangay: "Triangulo", zonalValuePerSqm: 4500 },
  { city: "Naga City", barangay: "Concepcion Pequeña", zonalValuePerSqm: 3800 },
  { city: "Naga City", barangay: "Pacol", zonalValuePerSqm: 1200 },
  { city: "Pili", barangay: "San Jose", zonalValuePerSqm: 1800 },
  { city: "Pili", barangay: "Sta. Cruz Norte", zonalValuePerSqm: 1500 },
  { city: "Pili", barangay: "Cadlan", zonalValuePerSqm: 900 },
  { city: "Legazpi City", barangay: "Bogtong", zonalValuePerSqm: 2200 },
  { city: "Legazpi City", barangay: "Rawis", zonalValuePerSqm: 2800 },
];
