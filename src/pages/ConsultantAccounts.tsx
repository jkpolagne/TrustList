import { Check, Copy, Link2, Pencil, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { createConsultant, getConsultantsByFirm, getFirmById, updateConsultant } from "../services";
import type {
  Consultant,
  ConsultantAccountStatus,
  ConsultantRole,
  PrcLicenseStatus,
} from "../types";
import "./ConsultantAccounts.css";

interface ConsultantFormState {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  prcLicenseNumber: string;
  prcLicenseStatus: PrcLicenseStatus;
  role: ConsultantRole;
  reportsTo: string;
  accountStatus: ConsultantAccountStatus;
}

const EMPTY_FORM: ConsultantFormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  prcLicenseNumber: "",
  prcLicenseStatus: "Pending",
  role: "Sales Person",
  reportsTo: "",
  accountStatus: "Active",
};

function consultantToForm(c: Consultant): ConsultantFormState {
  return {
    firstName: c.firstName,
    middleName: c.middleName ?? "",
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    password: c.password,
    prcLicenseNumber: c.prcLicenseNumber,
    prcLicenseStatus: c.prcLicenseStatus,
    role: c.role,
    reportsTo: c.reportsTo ?? "",
    accountStatus: c.accountStatus,
  };
}

const ROLE_FILTERS: Array<"All" | ConsultantRole> = ["All", "Broker", "Sales Manager", "Sales Person"];

function prcPillClass(status: PrcLicenseStatus): string {
  if (status === "Verified") return "status-pill--positive";
  if (status === "Pending") return "status-pill--pending";
  return "status-pill--negative";
}

export function ConsultantAccounts() {
  const { session } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [firmCode, setFirmCode] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | ConsultantRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ConsultantAccountStatus>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConsultantFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reload() {
    if (!session?.firmId) return;
    Promise.all([getConsultantsByFirm(session.firmId), getFirmById(session.firmId)]).then(
      ([data, firm]) => {
        setConsultants(data);
        setFirmCode(firm?.code ?? "");
        setLoading(false);
      },
    );
  }

  useEffect(reload, [session?.firmId]);

  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);
  const brokers = useMemo(() => consultants.filter((c) => c.role === "Broker"), [consultants]);
  const salesManagers = useMemo(
    () => consultants.filter((c) => c.role === "Sales Manager"),
    [consultants],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return consultants.filter((c) => {
      if (roleFilter !== "All" && c.role !== roleFilter) return false;
      if (statusFilter !== "All" && c.accountStatus !== statusFilter) return false;
      if (term && !c.name.toLowerCase().includes(term) && !c.email.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [consultants, search, roleFilter, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setGeneratedLink(null);
    setCopied(false);
    setModalOpen(true);
  }

  function openEditModal(c: Consultant) {
    setEditingId(c.id);
    setForm(consultantToForm(c));
    setGeneratedLink(null);
    setCopied(false);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.firmId) return;
    setSaving(true);

    const payload = {
      companyId: session.firmId,
      firstName: form.firstName,
      middleName: form.middleName || undefined,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      prcLicenseNumber: form.prcLicenseNumber,
      prcLicenseStatus: form.prcLicenseStatus,
      role: form.role,
      reportsTo: form.role === "Broker" ? undefined : form.reportsTo || undefined,
      accountStatus: form.accountStatus,
    };

    const result = editingId
      ? await updateConsultant(editingId, payload, firmCode)
      : await createConsultant(payload, firmCode);

    setSaving(false);

    if (result?.linkGenerated && result.consultant.linkCode) {
      setGeneratedLink({
        name: result.consultant.name,
        url: `${window.location.origin}/?ref=${result.consultant.linkCode}`,
      });
      reload();
      return;
    }

    setModalOpen(false);
    reload();
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — the link is still visible to copy manually
    }
  }

  const showAssignField = form.role !== "Broker";
  const assignOptions = form.role === "Sales Manager" ? brokers : salesManagers;

  return (
    <div className="consultant-accounts-page">
      <header className="consultant-accounts-page__header">
        <h1>Consultant Accounts</h1>
        <p>Brokers, Sales Managers, and Sales Persons for your firm.</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All Roles" : r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="admin-toolbar__spacer" />
        <button type="button" className="admin-toolbar__add" onClick={openAddModal}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          Add Consultant
        </button>
      </div>

      {loading ? (
        <Skeleton height={360} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No consultants found"
          description="Try clearing your search or filters, or add your first consultant."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Contact</th>
                <th>PRC License</th>
                <th>Reports To</th>
                <th>Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="consultant-accounts-page__name">{c.name}</td>
                  <td>{c.role}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>
                    <div className="consultant-accounts-page__prc">
                      <span>{c.prcLicenseNumber}</span>
                      <span className={`status-pill ${prcPillClass(c.prcLicenseStatus)}`}>
                        {c.prcLicenseStatus}
                      </span>
                    </div>
                  </td>
                  <td>{c.reportsTo ? (consultantsById.get(c.reportsTo)?.name ?? "—") : "—"}</td>
                  <td>
                    <span
                      className={`status-pill ${c.accountStatus === "Active" ? "status-pill--positive" : "status-pill--neutral"}`}
                    >
                      {c.accountStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="consultant-accounts-page__edit"
                      onClick={() => openEditModal(c)}
                      aria-label={`Edit ${c.name}`}
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
        title={editingId ? "Edit Consultant" : "Add Consultant"}
        onClose={() => setModalOpen(false)}
        width={620}
      >
        {generatedLink ? (
          <div className="consultant-accounts-page__link-success">
            <div className="consultant-accounts-page__link-icon">
              <Link2 size={22} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3>Consultant link generated</h3>
            <p>
              <strong>{generatedLink.name}</strong> can now share this unique link — visits and
              inquiries through it will be attributed to them.
            </p>
            <div className="consultant-accounts-page__link-row">
              <code>{generatedLink.url}</code>
              <button type="button" onClick={handleCopyLink}>
                {copied ? (
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Copy size={14} strokeWidth={2} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              type="button"
              className="admin-form__submit"
              onClick={() => setModalOpen(false)}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__section">
              <span className="admin-form__section-title">Personal Information</span>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="middleName">Middle name</label>
                  <input
                    id="middleName"
                    type="text"
                    value={form.middleName}
                    onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label htmlFor="consEmail">Email</label>
                  <input
                    id="consEmail"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="consPhone">Contact number</label>
                  <input
                    id="consPhone"
                    type="tel"
                    required
                    placeholder="09XX-XXX-XXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="admin-form__section admin-form__section--credentials">
              <span className="admin-form__section-title">Credentials</span>
              <div className="admin-form__field">
                <label htmlFor="consPassword">Password</label>
                <input
                  id="consPassword"
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label htmlFor="prcNumber">PRC license number</label>
                  <input
                    id="prcNumber"
                    type="text"
                    required
                    value={form.prcLicenseNumber}
                    onChange={(e) => setForm({ ...form, prcLicenseNumber: e.target.value })}
                  />
                </div>
                <div className="admin-form__field">
                  <label htmlFor="prcStatus">PRC license status</label>
                  <select
                    id="prcStatus"
                    value={form.prcLicenseStatus}
                    onChange={(e) =>
                      setForm({ ...form, prcLicenseStatus: e.target.value as PrcLicenseStatus })
                    }
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Unverified">Unverified</option>
                  </select>
                </div>
              </div>
              <p className="admin-form__hint">
                This drives the public "PRC Verified" trust badge shown on listings this
                consultant refers — only Verified shows the green badge; Unverified shows none.
              </p>
            </div>

            <div className="admin-form__section admin-form__section--role">
              <span className="admin-form__section-title">Role &amp; Assignment</span>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label htmlFor="consRole">Role</label>
                  <select
                    id="consRole"
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value as ConsultantRole,
                        reportsTo: "",
                      })
                    }
                  >
                    <option value="Broker">Broker</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Person">Sales Person</option>
                  </select>
                </div>
                <div className="admin-form__field">
                  <label htmlFor="consAccountStatus">Account status</label>
                  <select
                    id="consAccountStatus"
                    value={form.accountStatus}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountStatus: e.target.value as ConsultantAccountStatus,
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {showAssignField ? (
                <div className="admin-form__field">
                  <label htmlFor="consReportsTo">
                    Assign under {form.role === "Sales Manager" ? "Broker" : "Sales Manager"}
                  </label>
                  <select
                    id="consReportsTo"
                    required
                    value={form.reportsTo}
                    onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {assignOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="admin-form__hint">
                  Brokers don't report to anyone and never receive a consultant link.
                </p>
              )}

              {form.role !== "Broker" ? (
                <p className="admin-form__hint">
                  {editingId
                    ? "This consultant already has a link — saving here won't change it."
                    : "Saving will generate a unique consultant link for this role."}
                </p>
              ) : null}
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
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Consultant"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
