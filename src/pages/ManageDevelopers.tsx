import { Building2, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { createDeveloper, getDevelopersByFirm, updateDeveloper } from "../services";
import type { Developer, DeveloperStatus } from "../types";
import "./ManageDevelopers.css";

interface DeveloperFormState {
  name: string;
  status: DeveloperStatus;
  totalCutPercent: string;
  directBroker: string;
  directSalesManager: string;
  referredBroker: string;
  referredSalesManager: string;
  referredSalesPerson: string;
  milestoneCash: string;
  milestoneInHouse: string;
  milestoneBank: string;
}

const EMPTY_FORM: DeveloperFormState = {
  name: "",
  status: "Active",
  totalCutPercent: "8",
  directBroker: "2",
  directSalesManager: "6",
  referredBroker: "2",
  referredSalesManager: "2",
  referredSalesPerson: "4",
  milestoneCash: "100",
  milestoneInHouse: "25",
  milestoneBank: "25",
};

function developerToForm(dev: Developer): DeveloperFormState {
  return {
    name: dev.name,
    status: dev.status,
    totalCutPercent: String(dev.totalCutPercent),
    directBroker: String(dev.commissionRates.direct.broker),
    directSalesManager: String(dev.commissionRates.direct.salesManager),
    referredBroker: String(dev.commissionRates.referred.broker),
    referredSalesManager: String(dev.commissionRates.referred.salesManager),
    referredSalesPerson: String(dev.commissionRates.referred.salesPerson),
    milestoneCash: String(dev.requiredMilestonePercent.cash),
    milestoneInHouse: String(dev.requiredMilestonePercent.inHouse),
    milestoneBank: String(dev.requiredMilestonePercent.bank),
  };
}

export function ManageDevelopers() {
  const { session } = useAuth();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DeveloperStatus>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeveloperFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function reload() {
    if (!session?.firmId) return;
    getDevelopersByFirm(session.firmId).then((data) => {
      setDevelopers(data);
      setLoading(false);
    });
  }

  useEffect(reload, [session?.firmId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return developers.filter((dev) => {
      if (statusFilter !== "All" && dev.status !== statusFilter) return false;
      if (term && !dev.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [developers, search, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(dev: Developer) {
    setEditingId(dev.id);
    setForm(developerToForm(dev));
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.firmId) return;
    setSaving(true);

    const payload = {
      companyId: session.firmId,
      name: form.name,
      status: form.status,
      totalCutPercent: Number(form.totalCutPercent),
      commissionRates: {
        direct: {
          broker: Number(form.directBroker),
          salesManager: Number(form.directSalesManager),
          salesPerson: 0,
        },
        referred: {
          broker: Number(form.referredBroker),
          salesManager: Number(form.referredSalesManager),
          salesPerson: Number(form.referredSalesPerson),
        },
      },
      requiredMilestonePercent: {
        cash: Number(form.milestoneCash),
        inHouse: Number(form.milestoneInHouse),
        bank: Number(form.milestoneBank),
      },
    };

    if (editingId) {
      await updateDeveloper(editingId, payload);
    } else {
      await createDeveloper(payload);
    }

    setSaving(false);
    setModalOpen(false);
    reload();
  }

  const directSum = Number(form.directBroker || 0) + Number(form.directSalesManager || 0);
  const referredSum =
    Number(form.referredBroker || 0) +
    Number(form.referredSalesManager || 0) +
    Number(form.referredSalesPerson || 0);

  return (
    <div className="manage-developers-page">
      <header className="manage-developers-page__header">
        <h1>Developers</h1>
        <p>Per-developer commission rates and milestone rules for your firm.</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search developers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="admin-toolbar__spacer" />
        <button type="button" className="admin-toolbar__add" onClick={openAddModal}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          Add Developer
        </button>
      </div>

      {loading ? (
        <Skeleton height={320} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No developers found"
          description="Try clearing your search or filter, or add your first developer."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th className="data-table__numeric">Total Cut</th>
                <th>Direct (Broker / SM)</th>
                <th>Referred (Broker / SM / SP)</th>
                <th>Milestone (Cash / In-House / Bank)</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((dev) => (
                <tr key={dev.id}>
                  <td className="manage-developers-page__name">{dev.name}</td>
                  <td className="data-table__numeric money">{dev.totalCutPercent}%</td>
                  <td>
                    {dev.commissionRates.direct.broker}% / {dev.commissionRates.direct.salesManager}%
                  </td>
                  <td>
                    {dev.commissionRates.referred.broker}% /{" "}
                    {dev.commissionRates.referred.salesManager}% /{" "}
                    {dev.commissionRates.referred.salesPerson}%
                  </td>
                  <td>
                    {dev.requiredMilestonePercent.cash}% / {dev.requiredMilestonePercent.inHouse}% /{" "}
                    {dev.requiredMilestonePercent.bank}%
                  </td>
                  <td>
                    <span
                      className={`status-pill ${dev.status === "Active" ? "status-pill--positive" : "status-pill--neutral"}`}
                    >
                      {dev.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="manage-developers-page__edit"
                      onClick={() => openEditModal(dev)}
                      aria-label={`Edit ${dev.name}`}
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
        title={editingId ? "Edit Developer" : "Add Developer"}
        onClose={() => setModalOpen(false)}
        width={640}
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="devName">Developer name</label>
              <input
                id="devName"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="devTotalCut">Total developer cut %</label>
              <input
                id="devTotalCut"
                type="number"
                min={0}
                step={0.1}
                required
                value={form.totalCutPercent}
                onChange={(e) => setForm({ ...form, totalCutPercent: e.target.value })}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="devStatus">Status</label>
              <select
                id="devStatus"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DeveloperStatus })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="admin-form__section admin-form__section--direct">
            <span className="admin-form__section-title">Direct Sale Rates</span>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="directBroker">Broker %</label>
                <input
                  id="directBroker"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={form.directBroker}
                  onChange={(e) => setForm({ ...form, directBroker: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="directSM">Sales Manager %</label>
                <input
                  id="directSM"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={form.directSalesManager}
                  onChange={(e) => setForm({ ...form, directSalesManager: e.target.value })}
                />
              </div>
            </div>
            <p className="admin-form__hint">
              No Sales Person share on Direct sales. Sum: {directSum.toFixed(1)}%
            </p>
          </div>

          <div className="admin-form__section admin-form__section--referred">
            <span className="admin-form__section-title">Referred Sale Rates</span>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="referredBroker">Broker %</label>
                <input
                  id="referredBroker"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={form.referredBroker}
                  onChange={(e) => setForm({ ...form, referredBroker: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="referredSM">Sales Manager %</label>
                <input
                  id="referredSM"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={form.referredSalesManager}
                  onChange={(e) => setForm({ ...form, referredSalesManager: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="referredSP">Sales Person %</label>
                <input
                  id="referredSP"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={form.referredSalesPerson}
                  onChange={(e) => setForm({ ...form, referredSalesPerson: e.target.value })}
                />
              </div>
            </div>
            <p className="admin-form__hint">Sum: {referredSum.toFixed(1)}%</p>
          </div>

          <div className="admin-form__section admin-form__section--milestone">
            <span className="admin-form__section-title">
              Required Milestone % (of contract price) per Payment Method
            </span>
            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="milestoneCash">Cash %</label>
                <input
                  id="milestoneCash"
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={form.milestoneCash}
                  onChange={(e) => setForm({ ...form, milestoneCash: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="milestoneInHouse">In-House %</label>
                <input
                  id="milestoneInHouse"
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={form.milestoneInHouse}
                  onChange={(e) => setForm({ ...form, milestoneInHouse: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="milestoneBank">Bank %</label>
                <input
                  id="milestoneBank"
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={form.milestoneBank}
                  onChange={(e) => setForm({ ...form, milestoneBank: e.target.value })}
                />
              </div>
            </div>
          </div>

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
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Developer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
