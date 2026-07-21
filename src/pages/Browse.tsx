import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyDetailPanel } from "../components/PropertyDetailPanel";
import { PropertyMap } from "../components/PropertyMap";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useCompare } from "../context/CompareContext";
import { getDevelopers, getFirms, getPublicProperties } from "../services";
import type { Developer, Firm, Property, PropertyType } from "../types";
import { useNavigate } from "react-router-dom";
import "./Browse.css";

const PROPERTY_TYPES: PropertyType[] = ["House", "Townhouse", "Condominium", "Lot Only"];
const BEDROOM_OPTIONS = [1, 2, 3, 4];

interface Filters {
  search: string;
  city: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  firmId: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  city: "All",
  propertyType: "All",
  minPrice: "",
  maxPrice: "",
  bedrooms: "Any",
  firmId: "All",
};

export function Browse() {
  const navigate = useNavigate();
  const { compareIds, isComparing, isFull, addToCompare } = useCompare();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFirms(), getDevelopers(), getPublicProperties()]).then(
      ([firmsData, developersData, propertiesData]) => {
        setFirms(firmsData);
        setDevelopers(developersData);
        setProperties(propertiesData);
        setLoading(false);
      },
    );
  }, []);

  const firmsById = useMemo(() => new Map(firms.map((f) => [f.id, f])), [firms]);
  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city))).sort(),
    [properties],
  );

  const filteredProperties = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const min = filters.minPrice ? Number(filters.minPrice) : undefined;
    const max = filters.maxPrice ? Number(filters.maxPrice) : undefined;
    const minBedrooms = filters.bedrooms !== "Any" ? Number(filters.bedrooms) : undefined;

    return properties.filter((property) => {
      if (search) {
        const haystack = `${property.title} ${property.address}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.city !== "All" && property.city !== filters.city) return false;
      if (filters.propertyType !== "All" && property.propertyType !== filters.propertyType)
        return false;
      if (min !== undefined && property.price < min) return false;
      if (max !== undefined && property.price > max) return false;
      if (minBedrooms !== undefined && (property.bedrooms ?? 0) < minBedrooms) return false;
      if (filters.firmId !== "All" && property.companyId !== filters.firmId) return false;
      return true;
    });
  }, [properties, filters]);

  const mapProperties = useMemo(
    () => filteredProperties.filter((p) => p.status === "Available"),
    [filteredProperties],
  );

  const selectedProperty = selectedId
    ? (properties.find((p) => p.id === selectedId) ?? null)
    : null;

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleToggleCompare(id: string) {
    if (isComparing(id)) return;
    const filled = addToCompare(id);
    if (filled) navigate("/compare");
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.city !== "All" ||
    filters.propertyType !== "All" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.bedrooms !== "Any" ||
    filters.firmId !== "All";

  return (
    <div className={`browse-page${compareIds.length > 0 ? " browse-page--tray-visible" : ""}`}>
      <header className="browse-page__intro">
        <h1>Browse verified listings</h1>
        <p>
          {loading
            ? "Loading listings from every participating firm…"
            : `${filteredProperties.length} listing${filteredProperties.length === 1 ? "" : "s"} across ${firms.length} firms in Naga City, Pili, and Legazpi City.`}
        </p>
      </header>

      <div className={`browse-layout${selectedProperty ? " browse-layout--panel-open" : ""}`}>
        <div className="browse-main">
          <button
            type="button"
            className="browse-filters-toggle"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal size={15} strokeWidth={2} aria-hidden="true" />
            Filters
            {hasActiveFilters ? <span className="browse-filters-toggle__dot" /> : null}
          </button>

          <div className="browse-top">
            <aside className={`browse-filters${filtersOpen ? " browse-filters--open" : ""}`}>
              <div className="browse-filters__field">
                <label htmlFor="search">Search</label>
                <div className="browse-filters__search">
                  <Search size={15} strokeWidth={2} aria-hidden="true" />
                  <input
                    id="search"
                    type="text"
                    placeholder="Title or address"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                  />
                </div>
              </div>

              <div className="browse-filters__field">
                <label htmlFor="city">Location</label>
                <select
                  id="city"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                >
                  <option value="All">All Locations</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="browse-filters__field">
                <label htmlFor="propertyType">Property Type</label>
                <select
                  id="propertyType"
                  value={filters.propertyType}
                  onChange={(e) => updateFilter("propertyType", e.target.value)}
                >
                  <option value="All">All Types</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="browse-filters__field">
                <label>Price Range (₱)</label>
                <div className="browse-filters__range">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    aria-label="Minimum price"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              <div className="browse-filters__field">
                <label htmlFor="bedrooms">Bedrooms</label>
                <select
                  id="bedrooms"
                  value={filters.bedrooms}
                  onChange={(e) => updateFilter("bedrooms", e.target.value)}
                >
                  <option value="Any">Any</option>
                  {BEDROOM_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}+
                    </option>
                  ))}
                </select>
              </div>

              <div className="browse-filters__field">
                <label htmlFor="firm">Firm</label>
                <select
                  id="firm"
                  value={filters.firmId}
                  onChange={(e) => updateFilter("firmId", e.target.value)}
                >
                  <option value="All">All Firms</option>
                  {firms.map((firm) => (
                    <option key={firm.id} value={firm.id}>
                      {firm.name}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="browse-filters__clear"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  <X size={13} strokeWidth={2} aria-hidden="true" />
                  Clear filters
                </button>
              ) : null}
            </aside>

            <div className="browse-map">
              {loading ? (
                <Skeleton height="100%" />
              ) : (
                <PropertyMap
                  properties={mapProperties}
                  selectedId={selectedId}
                  onMarkerClick={setSelectedId}
                />
              )}
            </div>
          </div>

          <section className="browse-grid-section">
            <h2>{loading ? "Loading listings…" : `${filteredProperties.length} listings`}</h2>

            {loading ? (
              <div className="browse-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} height={272} />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No listings match your filters"
                description="Try widening your price range or clearing a filter."
                action={
                  <button
                    type="button"
                    className="browse-filters__clear"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear all filters
                  </button>
                }
              />
            ) : (
              <div className="browse-grid">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    firmName={firmsById.get(property.companyId)?.name ?? ""}
                    active={property.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedProperty ? (
          <PropertyDetailPanel
            property={selectedProperty}
            firmName={firmsById.get(selectedProperty.companyId)?.name ?? ""}
            developerName={
              selectedProperty.developerId
                ? developersById.get(selectedProperty.developerId)?.name
                : undefined
            }
            isComparing={isComparing(selectedProperty.id)}
            compareDisabled={isFull}
            onToggleCompare={handleToggleCompare}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>

      {compareIds.length > 0 ? (
        <div className="browse-compare-tray">
          <span>
            {compareIds.length} of 2 selected for comparison
          </span>
          {compareIds.length === 2 ? (
            <button type="button" onClick={() => navigate("/compare")}>
              Compare now
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
