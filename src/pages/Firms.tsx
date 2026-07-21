import { Building2, RefreshCw, ShieldPlus, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { StatusCard } from "../components/StatusCard";
import {
  generateTemporaryPassword,
  createCompanyAdmin,
  getCompanyAdminCounts,
  getFirms,
  onboardFirm,
  updateFirmStatus,
} from "../services";
import type { Firm, FirmStatus } from "../types";
import "./Firms.css";

const EMPTY_ONBOARD_FORM = {
  name: "",
  city: "",
  address: "",
  email: "",
  contactNumber: "",
  status: "Active" as FirmStatus,
};

export function Firms() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [adminCounts, setAdminCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState(EMPTY_ONBOARD_FORM);
  const [onboarding, setOnboarding] = useState(false);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminFirmId, setAdminFirmId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ name: string; password: string } | null>(
    null,
  );

  function reload() {
    Promise.all([getFirms(), getCompanyAdminCounts()]).then(([firmsData, counts]) => {
      setFirms(firmsData);
      setAdminCounts(counts);
      setLoading(false);
    });
  }

  useEffect(reload, []);

  function openAdminModal() {
    setAdminFirmId(firms[0]?.id ?? "");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword(generateTemporaryPassword());
    setCreatedAdmin(null);
    setAdminModalOpen(true);
  }

  async function handleOnboardSubmit(e: FormEvent) {
    e.preventDefault();
    setOnboarding(true);
    await onboardFirm(onboardForm);
    setOnboarding(false);
    setOnboardOpen(false);
    setOnboardForm(EMPTY_ONBOARD_FORM);
    reload();
  }

  async function handleCreateAdminSubmit(e: FormEvent) {
    e.preventDefault();
    if (!adminFirmId) return;
    setCreatingAdmin(true);
    await createCompanyAdmin({
      firmId: adminFirmId,
      name: adminName,
      email: adminEmail,
      temporaryPassword: adminPassword,
    });
    setCreatingAdmin(false);
    setCreatedAdmin({ name: adminName, password: adminPassword });
    reload();
  }

  async function handleToggleStatus(firm: Firm) {
    await updateFirmStatus(firm.id, firm.status === "Active" ? "Suspended" : "Active");
    reload();
  }

  return (
    <div className="firms-page">
      <header className="firms-page__header">
        <div>
          <h1>Firms</h1>
          <p>Every firm participating in the platform — not scoped to any single company.</p>
        </div>
        <div className="firms-page__header-actions">
          <button type="button" className="firms-page__action" onClick={openAdminModal}>
            <UserPlus size={15} strokeWidth={2} aria-hidden="true" />
            Create Company Admin
          </button>
          <button
            type="button"
            className="firms-page__action firms-page__action--primary"
            onClick={() => setOnboardOpen(true)}
          >
            <ShieldPlus size={15} strokeWidth={2} aria-hidden="true" />
            Onboard New Firm
          </button>
        </div>
      </header>

      {loading ? (
        <div className="firms-grid">
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
        </div>
      ) : (
        <div className="firms-grid">
          {firms.map((firm) => (
            <StatusCard key={firm.id} accent={firm.status === "Active" ? "gold" : "red"}>
              <div className="firm-card">
                <div className="firm-card__top">
                  <span className="firm-card__code">{firm.code}</span>
                  <span
                    className={`status-pill ${firm.status === "Active" ? "status-pill--positive" : "status-pill--negative"}`}
                  >
                    {firm.status}
                  </span>
                </div>
                <h3>{firm.name}</h3>
                <p className="firm-card__city">{firm.city}</p>
                <div className="firm-card__meta">
                  <span>
                    <Building2 size={13} strokeWidth={2} aria-hidden="true" />
                    {adminCounts[firm.id] ?? 0} admin{(adminCounts[firm.id] ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <button
                  type="button"
                  className="firm-card__toggle"
                  onClick={() => handleToggleStatus(firm)}
                >
                  <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
                  {firm.status === "Active" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            </StatusCard>
          ))}
        </div>
      )}

      <Modal open={onboardOpen} title="Onboard New Firm" onClose={() => setOnboardOpen(false)}>
        <form className="admin-form" onSubmit={handleOnboardSubmit}>
          <div className="admin-form__field">
            <label htmlFor="firmName">Firm name</label>
            <input
              id="firmName"
              type="text"
              required
              value={onboardForm.name}
              onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
            />
          </div>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="firmCity">City</label>
              <input
                id="firmCity"
                type="text"
                required
                value={onboardForm.city}
                onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="firmStatus">Status</label>
              <select
                id="firmStatus"
                value={onboardForm.status}
                onChange={(e) =>
                  setOnboardForm({ ...onboardForm, status: e.target.value as FirmStatus })
                }
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="admin-form__field">
            <label htmlFor="firmAddress">Address</label>
            <input
              id="firmAddress"
              type="text"
              required
              value={onboardForm.address}
              onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
            />
          </div>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="firmEmail">Email</label>
              <input
                id="firmEmail"
                type="email"
                required
                value={onboardForm.email}
                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="firmContact">Contact number</label>
              <input
                id="firmContact"
                type="tel"
                required
                placeholder="0XX-XXX-XXXX"
                value={onboardForm.contactNumber}
                onChange={(e) => setOnboardForm({ ...onboardForm, contactNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="admin-form__actions">
            <button
              type="button"
              className="admin-form__cancel"
              onClick={() => setOnboardOpen(false)}
              disabled={onboarding}
            >
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={onboarding}>
              {onboarding ? "Onboarding…" : "Onboard Firm"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={adminModalOpen}
        title="Create Company Admin"
        onClose={() => setAdminModalOpen(false)}
      >
        {createdAdmin ? (
          <div className="firms-page__admin-created">
            <p>
              <strong>{createdAdmin.name}</strong> can now sign in as Company Admin.
            </p>
            <div className="firms-page__admin-created-password">
              Temporary password: <code>{createdAdmin.password}</code>
            </div>
            <button
              type="button"
              className="admin-form__submit"
              onClick={() => setAdminModalOpen(false)}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleCreateAdminSubmit}>
            <div className="admin-form__field">
              <label htmlFor="adminFirm">Firm</label>
              <select
                id="adminFirm"
                required
                value={adminFirmId}
                onChange={(e) => setAdminFirmId(e.target.value)}
              >
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form__field">
              <label htmlFor="adminName">Admin name</label>
              <input
                id="adminName"
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="adminEmail">Email</label>
              <input
                id="adminEmail"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="adminPassword">Temporary password</label>
              <div className="firms-page__password-row">
                <input
                  id="adminPassword"
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="firms-page__regenerate"
                  onClick={() => setAdminPassword(generateTemporaryPassword())}
                  aria-label="Generate a new temporary password"
                >
                  <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
              <span className="admin-form__hint">
                The admin will be asked to change this on first login.
              </span>
            </div>
            <div className="admin-form__actions">
              <button
                type="button"
                className="admin-form__cancel"
                onClick={() => setAdminModalOpen(false)}
                disabled={creatingAdmin}
              >
                Cancel
              </button>
              <button type="submit" className="admin-form__submit" disabled={creatingAdmin}>
                {creatingAdmin ? "Creating…" : "Create Admin"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
