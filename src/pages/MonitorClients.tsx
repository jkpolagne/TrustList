import { MessageCircle, Phone, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByConsultantIds,
  getConsultantsByFirm,
  getFirmById,
  getPropertiesByFirm,
  logClientContact,
} from "../services";
import type { Client, Consultant, Firm, Property } from "../types";
import { getRequirementsState } from "../utils/requirements";
import { getScopedConsultantIds } from "../utils/scope";
import "./MonitorClients.css";

type Tab = "view" | "contact";

function requirementsPillClass(state: ReturnType<typeof getRequirementsState>): string {
  if (state === "Complete") return "status-pill--positive";
  if (state === "Basic complete") return "status-pill--pending";
  return "status-pill--negative";
}

function formatDate(value?: string): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MonitorClients() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const consultantFilterParam = searchParams.get("consultant") ?? "";

  const [tab, setTab] = useState<Tab>("view");
  const [clients, setClients] = useState<Client[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [firm, setFirm] = useState<Firm | undefined>();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [contactModalClient, setContactModalClient] = useState<Client | null>(null);
  const [contactNotes, setContactNotes] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  function reload() {
    if (!session?.firmId || !session.consultantId) return;
    Promise.all([
      getConsultantsByFirm(session.firmId),
      getPropertiesByFirm(session.firmId),
      getFirmById(session.firmId),
    ]).then(([consultantsData, propertiesData, firmData]) => {
      setConsultants(consultantsData);
      setProperties(propertiesData);
      setFirm(firmData);

      const scopedIds = getScopedConsultantIds(session.consultantId!, session.role, consultantsData);
      getClientsByConsultantIds(scopedIds).then((clientsData) => {
        setClients(clientsData);
        setLoading(false);
      });
    });
  }

  useEffect(reload, [session?.firmId, session?.consultantId, session?.role]);

  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);
  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (consultantFilterParam && c.consultantId !== consultantFilterParam) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [clients, search, consultantFilterParam]);

  function openContactModal(client: Client) {
    setContactModalClient(client);
    setContactNotes(client.notes ?? "");
  }

  async function handleLogContact(e: FormEvent) {
    e.preventDefault();
    if (!contactModalClient) return;
    setSavingContact(true);
    await logClientContact(contactModalClient.id, contactNotes);
    setSavingContact(false);
    setContactModalClient(null);
    reload();
  }

  const filterConsultant = consultantFilterParam ? consultantsById.get(consultantFilterParam) : null;

  return (
    <div className="monitor-clients-page">
      <header className="monitor-clients-page__header">
        <h1>Monitor Clients</h1>
        <p>
          {session?.role === "Sales Manager"
            ? "Your own clients plus your team's."
            : "Clients assigned to you."}
        </p>
        {filterConsultant ? (
          <div className="monitor-clients-page__filter-chip">
            Showing only {filterConsultant.name}
            <button type="button" onClick={() => setSearchParams({})}>
              Clear
            </button>
          </div>
        ) : null}
      </header>

      <div className="monitor-clients-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "view"}
          className={`monitor-clients-page__tab${tab === "view" ? " monitor-clients-page__tab--active" : ""}`}
          onClick={() => setTab("view")}
        >
          View Clients
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "contact"}
          className={`monitor-clients-page__tab${tab === "contact" ? " monitor-clients-page__tab--active" : ""}`}
          onClick={() => setTab("contact")}
        >
          Contact Clients
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search client name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Skeleton height={360} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Clients assigned to you or your team will show up here."
        />
      ) : tab === "view" ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Property</th>
                <th>Firm</th>
                <th>Consultant</th>
                <th>Payment Method</th>
                <th>Employment</th>
                <th>Status</th>
                <th>Tranche Progress</th>
                <th>Requirements</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  data-clickable="true"
                  onClick={() => navigate(`/app/clients/${client.id}`)}
                >
                  <td className="monitor-clients-page__name">{client.name}</td>
                  <td>{propertiesById.get(client.propertyId)?.title ?? client.propertyId}</td>
                  <td>{firm?.name ?? "—"}</td>
                  <td>{consultantsById.get(client.consultantId)?.name ?? "—"}</td>
                  <td>{client.paymentMethod}</td>
                  <td>{client.employmentStatus}</td>
                  <td>
                    <span
                      className={`status-pill ${client.status === "Fully Released" ? "status-pill--positive" : "status-pill--neutral"}`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td>
                    Tranche {client.currentTranche} of {client.totalTranches} reached
                  </td>
                  <td>
                    <span className={`status-pill ${requirementsPillClass(getRequirementsState(client))}`}>
                      {getRequirementsState(client)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Last Contacted</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td className="monitor-clients-page__name">{client.name}</td>
                  <td>
                    <a href={`tel:${client.contactNumber}`} className="monitor-clients-page__contact-link">
                      <Phone size={13} strokeWidth={2} aria-hidden="true" />
                      {client.contactNumber}
                    </a>
                  </td>
                  <td>
                    <a href={`mailto:${client.email}`} className="monitor-clients-page__contact-link">
                      {client.email}
                    </a>
                  </td>
                  <td>{formatDate(client.lastContactedDate)}</td>
                  <td className="monitor-clients-page__notes">{client.notes || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="monitor-clients-page__log-btn"
                      onClick={() => openContactModal(client)}
                    >
                      <MessageCircle size={13} strokeWidth={2} aria-hidden="true" />
                      Log Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(contactModalClient)}
        title={`Log Contact — ${contactModalClient?.name ?? ""}`}
        onClose={() => setContactModalClient(null)}
        width={480}
      >
        <form className="admin-form" onSubmit={handleLogContact}>
          <p className="admin-form__hint">
            This sets last contacted to today ({formatDate(new Date().toISOString())}).
          </p>
          <div className="admin-form__field">
            <label htmlFor="contactNotes">Notes</label>
            <textarea
              id="contactNotes"
              rows={4}
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              placeholder="What did you discuss? Any follow-up needed?"
            />
          </div>
          <div className="admin-form__actions">
            <button
              type="button"
              className="admin-form__cancel"
              onClick={() => setContactModalClient(null)}
              disabled={savingContact}
            >
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={savingContact}>
              {savingContact ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
