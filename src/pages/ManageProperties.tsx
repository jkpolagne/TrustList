import { Home, Pencil, Plus, Search, ShieldQuestion, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PropertyValuationCard } from "../components/PropertyValuationCard";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import {
  createProperty,
  getDevelopersByFirm,
  getLoanQuotationByProperty,
  getLocations,
  getPropertiesByFirm,
  mockVerificationDocuments,
  updateProperty,
} from "../services";
import type {
  Developer,
  ListingSource,
  LoanQuotation,
  LocationZonalValue,
  Property,
  PropertyStatus,
  PropertyType,
} from "../types";
import { formatPHP } from "../utils/finance";
import "./ManageProperties.css";

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Naga City": { lat: 13.6218, lng: 123.1948 },
  Pili: { lat: 13.5661, lng: 123.2767 },
  "Legazpi City": { lat: 13.1391, lng: 123.7438 },
};
const CITIES = Object.keys(CITY_COORDINATES);
const PROPERTY_TYPES: PropertyType[] = ["House", "Townhouse", "Condominium", "Lot Only"];

interface PropertyFormState {
  title: string;
  listingSource: ListingSource;
  developerId: string;
  propertyType: PropertyType;
  price: string;
  status: PropertyStatus;
  city: string;
  barangay: string;
  address: string;
  lat: string;
  lng: string;
  lotAreaSqm: string;
  floorAreaSqm: string;
  bedrooms: string;
  bathrooms: string;
  turnover: string;
  houseModel: string;
  description: string;
  ownerName: string;
}

const EMPTY_FORM: PropertyFormState = {
  title: "",
  listingSource: "Developer",
  developerId: "",
  propertyType: "House",
  price: "",
  status: "Available",
  city: CITIES[0],
  barangay: "",
  address: "",
  lat: String(CITY_COORDINATES[CITIES[0]].lat),
  lng: String(CITY_COORDINATES[CITIES[0]].lng),
  lotAreaSqm: "",
  floorAreaSqm: "",
  bedrooms: "",
  bathrooms: "",
  turnover: "Ready for occupancy",
  houseModel: "",
  description: "",
  ownerName: "",
};

function propertyToForm(p: Property): PropertyFormState {
  return {
    title: p.title,
    listingSource: p.listingSource,
    developerId: p.developerId ?? "",
    propertyType: p.propertyType,
    price: String(p.price),
    status: p.status,
    city: p.city,
    barangay: p.barangay,
    address: p.address,
    lat: String(p.coordinates.lat),
    lng: String(p.coordinates.lng),
    lotAreaSqm: p.lotAreaSqm !== undefined ? String(p.lotAreaSqm) : "",
    floorAreaSqm: p.floorAreaSqm !== undefined ? String(p.floorAreaSqm) : "",
    bedrooms: p.bedrooms !== undefined ? String(p.bedrooms) : "",
    bathrooms: p.bathrooms !== undefined ? String(p.bathrooms) : "",
    turnover: p.turnover,
    houseModel: p.houseModel ?? "",
    description: p.description,
    ownerName: "",
  };
}

export function ManageProperties() {
  const { session } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [developerFilter, setDeveloperFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "House and Lot" | "Lot Only">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PropertyStatus>("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | ListingSource>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormState>(EMPTY_FORM);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<LocationZonalValue[]>([]);
  const [editingLoanQuotation, setEditingLoanQuotation] = useState<LoanQuotation>();

  const editingProperty = editingId ? properties.find((p) => p.id === editingId) : undefined;

  function reload() {
    if (!session?.firmId) return;
    Promise.all([getPropertiesByFirm(session.firmId), getDevelopersByFirm(session.firmId)]).then(
      ([propertiesData, developersData]) => {
        setProperties(propertiesData);
        setDevelopers(developersData);
        setLoading(false);
      },
    );
  }

  useEffect(reload, [session?.firmId]);
  useEffect(() => {
    getLocations().then(setLocations);
  }, []);

  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);
  const editingZonalValuePerSqm = useMemo(() => {
    if (!editingProperty) return undefined;
    return locations.find(
      (l) =>
        l.city === editingProperty.city &&
        l.barangay.trim().toLowerCase() === editingProperty.barangay.trim().toLowerCase(),
    )?.zonalValuePerSqm;
  }, [locations, editingProperty]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (term && !p.title.toLowerCase().includes(term) && !p.address.toLowerCase().includes(term))
        return false;
      if (developerFilter !== "All" && p.developerId !== developerFilter) return false;
      if (typeFilter === "Lot Only" && p.propertyType !== "Lot Only") return false;
      if (typeFilter === "House and Lot" && p.propertyType === "Lot Only") return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (sourceFilter !== "All" && p.listingSource !== sourceFilter) return false;
      return true;
    });
  }, [properties, search, developerFilter, typeFilter, statusFilter, sourceFilter]);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFeatures([]);
    setImages([]);
    setEditingLoanQuotation(undefined);
    setModalOpen(true);
  }

  function openEditModal(p: Property) {
    setEditingId(p.id);
    setForm(propertyToForm(p));
    setFeatures(p.features);
    setImages(p.images);
    setEditingLoanQuotation(undefined);
    getLoanQuotationByProperty(p.id).then(setEditingLoanQuotation);
    setModalOpen(true);
  }

  function handleCityChange(city: string) {
    const coords = CITY_COORDINATES[city];
    setForm({ ...form, city, lat: String(coords.lat), lng: String(coords.lng) });
  }

  function addFeature() {
    const value = featureInput.trim();
    if (value && !features.includes(value)) setFeatures([...features, value]);
    setFeatureInput("");
  }

  function addImage() {
    const value = imageInput.trim();
    if (value && !images.includes(value)) setImages([...images, value]);
    setImageInput("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.firmId) return;
    setSaving(true);

    const isLotOnly = form.propertyType === "Lot Only";
    const isIndividualSeller = form.listingSource === "Individual Seller";

    const payload = {
      companyId: session.firmId,
      developerId: form.listingSource === "Developer" ? form.developerId || undefined : undefined,
      title: form.title,
      propertyType: form.propertyType,
      city: form.city,
      barangay: form.barangay,
      address: form.address,
      price: Number(form.price),
      bedrooms: isLotOnly ? undefined : form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: isLotOnly ? undefined : form.bathrooms ? Number(form.bathrooms) : undefined,
      lotAreaSqm: form.lotAreaSqm ? Number(form.lotAreaSqm) : undefined,
      floorAreaSqm: isLotOnly ? undefined : form.floorAreaSqm ? Number(form.floorAreaSqm) : undefined,
      isLotOnly,
      status: form.status,
      listingSource: form.listingSource,
      verificationStatus: isIndividualSeller
        ? (editingProperty?.verificationStatus ?? "Pending Review")
        : undefined,
      verificationDocuments: isIndividualSeller
        ? (editingProperty?.verificationDocuments ??
          mockVerificationDocuments(form.ownerName || form.title))
        : undefined,
      verificationRejectionReason: isIndividualSeller
        ? editingProperty?.verificationRejectionReason
        : undefined,
      description: form.description,
      coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
      turnover: isLotOnly ? "Titled, ready for construction" : form.turnover,
      houseModel: isLotOnly ? undefined : form.houseModel || undefined,
      features,
      images,
    };

    if (editingId) {
      await updateProperty(editingId, payload);
    } else {
      await createProperty(payload);
    }

    setSaving(false);
    setModalOpen(false);
    reload();
  }

  const isLotOnly = form.propertyType === "Lot Only";
  const isIndividualSeller = form.listingSource === "Individual Seller";

  return (
    <div className="manage-properties-page">
      <header className="manage-properties-page__header">
        <h1>Properties</h1>
        <p>Your firm's full property inventory, developer-sourced and individual seller alike.</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search title or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={developerFilter} onChange={(e) => setDeveloperFilter(e.target.value)}>
          <option value="All">All Developers</option>
          {developers.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.name}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="All">All Types</option>
          <option value="House and Lot">House and Lot</option>
          <option value="Lot Only">Lot Only</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Sold">Sold</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}>
          <option value="All">All Sources</option>
          <option value="Developer">Developer</option>
          <option value="Individual Seller">Individual Seller</option>
        </select>
        <div className="admin-toolbar__spacer" />
        <button type="button" className="admin-toolbar__add" onClick={openAddModal}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          Add Property
        </button>
      </div>

      {loading ? (
        <Skeleton height={360} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties found"
          description="Try clearing your filters, or add your first property."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th className="data-table__numeric">Price</th>
                <th>Source</th>
                <th>Status</th>
                <th>Verification</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="manage-properties-page__name">
                    {p.title}
                    <span className="manage-properties-page__address">{p.address}</span>
                  </td>
                  <td>{p.propertyType}</td>
                  <td className="data-table__numeric money">{formatPHP(p.price)}</td>
                  <td>
                    {p.listingSource === "Developer"
                      ? (developersById.get(p.developerId ?? "")?.name ?? "Developer")
                      : "Individual Seller"}
                  </td>
                  <td>{p.status}</td>
                  <td>
                    {p.listingSource === "Individual Seller" ? (
                      p.verificationStatus === "Verified" ? (
                        <VerificationBadge type="ownership" status="verified" />
                      ) : (
                        <span
                          className={`status-pill ${p.verificationStatus === "Rejected" ? "status-pill--negative" : "status-pill--pending"}`}
                        >
                          {p.verificationStatus}
                        </span>
                      )
                    ) : (
                      <span className="manage-properties-page__na">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="manage-properties-page__edit"
                      onClick={() => openEditModal(p)}
                      aria-label={`Edit ${p.title}`}
                    >
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Property" : "Add Property"}
        onClose={() => setModalOpen(false)}
        width={680}
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__field">
            <label htmlFor="propTitle">Property name</label>
            <input
              id="propTitle"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="propSource">Listing source</label>
              <select
                id="propSource"
                value={form.listingSource}
                onChange={(e) =>
                  setForm({ ...form, listingSource: e.target.value as ListingSource })
                }
              >
                <option value="Developer">Developer</option>
                <option value="Individual Seller">Individual Seller</option>
              </select>
            </div>
            {form.listingSource === "Developer" ? (
              <div className="admin-form__field">
                <label htmlFor="propDeveloper">Developer</label>
                <select
                  id="propDeveloper"
                  required
                  value={form.developerId}
                  onChange={(e) => setForm({ ...form, developerId: e.target.value })}
                >
                  <option value="">Select a developer…</option>
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : !editingId ? (
              <div className="admin-form__field">
                <label htmlFor="propOwnerName">Owner name</label>
                <input
                  id="propOwnerName"
                  type="text"
                  required
                  placeholder="For mock verification documents"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </div>
            ) : null}
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="propType">Property type</label>
              <select
                id="propType"
                value={form.propertyType}
                onChange={(e) =>
                  setForm({ ...form, propertyType: e.target.value as PropertyType })
                }
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form__field">
              <label htmlFor="propPrice">Price (₱)</label>
              <input
                id="propPrice"
                type="number"
                min={0}
                step={10000}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="propStatus">Status</label>
              <select
                id="propStatus"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PropertyStatus })}
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          </div>

          <div className="admin-form__section">
            <span className="admin-form__section-title">Location</span>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="propCity">City</label>
                <select id="propCity" value={form.city} onChange={(e) => handleCityChange(e.target.value)}>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form__field">
                <label htmlFor="propBarangay">Barangay</label>
                <input
                  id="propBarangay"
                  type="text"
                  required
                  placeholder="e.g. Triangulo"
                  value={form.barangay}
                  onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                />
              </div>
              <div className="admin-form__field admin-form__field--wide">
                <label htmlFor="propAddress">Address</label>
                <input
                  id="propAddress"
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
            <p className="admin-form__hint">
              Barangay feeds the Estimated Market Value's zonal valuation reference below.
            </p>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="propLat">Latitude</label>
                <input
                  id="propLat"
                  type="number"
                  step="any"
                  required
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="propLng">Longitude</label>
                <input
                  id="propLng"
                  type="number"
                  step="any"
                  required
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                />
              </div>
            </div>
          </div>

          {editingProperty ? (
            <div className="admin-form__section">
              <span className="admin-form__section-title">Estimated Market Value</span>
              <PropertyValuationCard
                property={editingProperty}
                zonalValuePerSqm={editingZonalValuePerSqm}
                loanQuotation={editingLoanQuotation}
              />
            </div>
          ) : null}

          <div className="admin-form__section">
            <span className="admin-form__section-title">Details</span>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="propLotArea">Lot area (sqm)</label>
                <input
                  id="propLotArea"
                  type="number"
                  min={0}
                  value={form.lotAreaSqm}
                  onChange={(e) => setForm({ ...form, lotAreaSqm: e.target.value })}
                />
              </div>
              {!isLotOnly ? (
                <div className="admin-form__field">
                  <label htmlFor="propFloorArea">Floor area (sqm)</label>
                  <input
                    id="propFloorArea"
                    type="number"
                    min={0}
                    value={form.floorAreaSqm}
                    onChange={(e) => setForm({ ...form, floorAreaSqm: e.target.value })}
                  />
                </div>
              ) : null}
            </div>

            {!isLotOnly ? (
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label htmlFor="propBedrooms">Bedrooms</label>
                  <input
                    id="propBedrooms"
                    type="number"
                    min={0}
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="propBathrooms">Bathrooms</label>
                  <input
                    id="propBathrooms"
                    type="number"
                    min={0}
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="propTurnover">Turnover status</label>
                  <input
                    id="propTurnover"
                    type="text"
                    value={form.turnover}
                    onChange={(e) => setForm({ ...form, turnover: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="propHouseModel">House model</label>
                  <input
                    id="propHouseModel"
                    type="text"
                    placeholder="e.g. Camia Model"
                    value={form.houseModel}
                    onChange={(e) => setForm({ ...form, houseModel: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <p className="admin-form__hint">
                Bedrooms, bathrooms, turnover status, and house model don't apply to lot-only
                listings.
              </p>
            )}
          </div>

          <div className="admin-form__field">
            <label htmlFor="propDescription">Description</label>
            <textarea
              id="propDescription"
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="admin-form__field">
            <label>Features / amenities</label>
            <div className="manage-properties-page__tag-input">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="Type a feature and press Enter"
              />
              <button type="button" onClick={addFeature}>
                Add
              </button>
            </div>
            <div className="manage-properties-page__tags">
              {features.map((f) => (
                <span key={f} className="manage-properties-page__tag">
                  {f}
                  <button type="button" onClick={() => setFeatures(features.filter((x) => x !== f))}>
                    <X size={11} strokeWidth={2} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="admin-form__field">
            <label>Photos</label>
            <div className="manage-properties-page__tag-input">
              <input
                type="text"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="Paste a photo URL"
              />
              <button type="button" onClick={addImage}>
                Add
              </button>
            </div>
            <p className="admin-form__hint">
              The first photo added is used as the listing's cover image.
            </p>
            <div className="manage-properties-page__tags">
              {images.map((img) => (
                <span key={img} className="manage-properties-page__tag">
                  {img}
                  <button type="button" onClick={() => setImages(images.filter((x) => x !== img))}>
                    <X size={11} strokeWidth={2} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {isIndividualSeller && editingId ? (
            <div className="admin-form__section manage-properties-page__verification">
              <span className="admin-form__section-title">
                Ownership Verification (read-only)
              </span>
              <div className="manage-properties-page__verification-status">
                {editingProperty?.verificationStatus === "Verified" ? (
                  <VerificationBadge type="ownership" status="verified" />
                ) : (
                  <span
                    className={`status-pill ${editingProperty?.verificationStatus === "Rejected" ? "status-pill--negative" : "status-pill--pending"}`}
                  >
                    {editingProperty?.verificationStatus}
                  </span>
                )}
              </div>
              <ul className="manage-properties-page__doc-list">
                {(editingProperty?.verificationDocuments ?? []).map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
              {editingProperty?.verificationRejectionReason ? (
                <p className="manage-properties-page__rejection-reason">
                  Rejected: {editingProperty.verificationRejectionReason}
                </p>
              ) : null}
              <Link to="/app/listing-verification" className="manage-properties-page__verify-link">
                <ShieldQuestion size={14} strokeWidth={2} aria-hidden="true" />
                Review in Listing Verification →
              </Link>
            </div>
          ) : null}

          <div className="admin-form__actions">
            <button
              type="button"
              className="admin-form__cancel"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Property"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
