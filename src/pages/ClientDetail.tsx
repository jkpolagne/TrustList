import {
  Banknote,
  Briefcase,
  ChevronLeft,
  FileText,
  Home,
  Mail,
  Phone,
  SearchX,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { MilestoneStatusCard } from "../components/MilestoneStatusCard";
import { RequirementsChecklistView } from "../components/RequirementsChecklistView";
import { Skeleton } from "../components/Skeleton";
import {
  getClientById,
  getConsultantById,
  getFirmById,
  getLatestMilestoneForClient,
  getPaymentProofsByClient,
  getPropertyById,
  getStatusHistoryByClient,
} from "../services";
import type {
  Client,
  ClientStatusHistoryEntry,
  Consultant,
  Firm,
  MilestoneEvent,
  PaymentProof,
  Property,
} from "../types";
import { formatPHP } from "../utils/finance";
import "./ClientDetail.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [property, setProperty] = useState<Property>();
  const [firm, setFirm] = useState<Firm>();
  const [consultant, setConsultant] = useState<Consultant>();
  const [history, setHistory] = useState<ClientStatusHistoryEntry[]>([]);
  const [milestone, setMilestone] = useState<MilestoneEvent>();
  const [proofs, setProofs] = useState<PaymentProof[]>([]);

  useEffect(() => {
    if (!id) return;
    getClientById(id).then((found) => {
      setClient(found ?? null);
      if (!found) return;
      getPropertyById(found.propertyId).then(setProperty);
      getFirmById(found.companyId).then(setFirm);
      getConsultantById(found.consultantId).then(setConsultant);
      getStatusHistoryByClient(found.id).then((entries) => setHistory(entries.slice().reverse()));
      getLatestMilestoneForClient(found.id).then(setMilestone);
      getPaymentProofsByClient(found.id).then(setProofs);
    });
  }, [id]);

  if (client === undefined) {
    return (
      <div className="client-detail">
        <Skeleton height={28} width="30%" style={{ marginBottom: 20 }} />
        <Skeleton height={400} />
      </div>
    );
  }

  if (client === null) {
    return (
      <EmptyState
        icon={SearchX}
        title="Client not found"
        description="This client may not exist, or may not be assigned to you."
        action={
          <Link to="/app/clients" className="client-detail__back">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back to clients
          </Link>
        }
      />
    );
  }

  const area = property?.isLotOnly ? property.lotAreaSqm : property?.floorAreaSqm;

  return (
    <div className="client-detail">
      <Link to="/app/clients" className="client-detail__back">
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to clients
      </Link>

      <div className="client-detail__header">
        <div>
          <h1>{client.name}</h1>
          <p className="client-detail__sale-type">
            {client.saleType === "Referred"
              ? `Referred Sale via ${consultant?.name ?? "consultant"}'s link`
              : "Direct Sale"}
          </p>
        </div>
        <span
          className={`status-pill ${client.status === "Fully Released" ? "status-pill--positive" : "status-pill--neutral"}`}
        >
          {client.status}
        </span>
      </div>

      <div className="client-detail__layout">
        <div className="client-detail__main">
          {milestone ? (
            <section className="client-detail__section">
              <h3>Milestone Status</h3>
              <MilestoneStatusCard milestone={milestone} />
            </section>
          ) : null}

          <section className="client-detail__section">
            <h3>Client Profile</h3>
            <dl className="client-detail__facts">
              <div>
                <dt>
                  <Phone size={14} strokeWidth={2} aria-hidden="true" /> Contact
                </dt>
                <dd>{client.contactNumber}</dd>
              </div>
              <div>
                <dt>
                  <Mail size={14} strokeWidth={2} aria-hidden="true" /> Email
                </dt>
                <dd>{client.email}</dd>
              </div>
              <div>
                <dt>
                  <Briefcase size={14} strokeWidth={2} aria-hidden="true" /> Employment
                </dt>
                <dd>{client.employmentStatus}</dd>
              </div>
              <div>
                <dt>
                  <Banknote size={14} strokeWidth={2} aria-hidden="true" /> Payment Method
                </dt>
                <dd>{client.paymentMethod}</dd>
              </div>
              <div>
                <dt>
                  <Home size={14} strokeWidth={2} aria-hidden="true" /> Property
                </dt>
                <dd>
                  {property?.title ?? "—"}
                  {area ? ` · ${area} sqm` : ""}
                </dd>
              </div>
              <div>
                <dt>Firm</dt>
                <dd>{firm?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Assigned Consultant</dt>
                <dd>{consultant?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Contract Price</dt>
                <dd className="money">{formatPHP(client.contractPrice)}</dd>
              </div>
              <div>
                <dt>Amount Paid</dt>
                <dd className="money">{formatPHP(client.amountPaid)}</dd>
              </div>
              <div>
                <dt>Tranche Progress</dt>
                <dd>
                  Tranche {client.currentTranche} of {client.totalTranches} reached
                </dd>
              </div>
            </dl>
          </section>

          <section className="client-detail__section">
            <h3>Requirements Checklist</h3>
            <RequirementsChecklistView client={client} />
          </section>

          <section className="client-detail__section">
            <h3>Status History</h3>
            {history.length === 0 ? (
              <p className="client-detail__empty-note">No status history recorded yet.</p>
            ) : (
              <ol className="client-detail__history">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <div className="client-detail__history-top">
                      <span className="client-detail__history-transition">
                        {entry.fromStatus} → {entry.toStatus}
                      </span>
                      <span className="client-detail__history-date">{formatDate(entry.date)}</span>
                    </div>
                    <p>{entry.remarks}</p>
                    <span className="client-detail__history-by">Updated by {entry.updatedBy}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {proofs.length > 0 ? (
            <section className="client-detail__section">
              <h3>Payment Proof History</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th className="data-table__numeric">Amount</th>
                      <th>Proof File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proofs.map((proof) => (
                      <tr key={proof.id}>
                        <td>{formatDate(proof.paymentDate)}</td>
                        <td>{proof.paymentType}</td>
                        <td className="data-table__numeric money">{formatPHP(proof.amount)}</td>
                        <td>
                          <span className="client-detail__proof-file">
                            <FileText size={13} strokeWidth={2} aria-hidden="true" />
                            {proof.proofFilename}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="client-detail__sidebar">
          <div className="client-detail__sidebar-card">
            <span className="client-detail__sidebar-label">Amount Paid</span>
            <span className="client-detail__sidebar-value money">
              {formatPHP(client.amountPaid)}
            </span>
            <span className="client-detail__sidebar-sub">
              of {formatPHP(client.contractPrice)} contract price
            </span>
            <Link
              to={`/app/payment-proof?client=${client.id}`}
              className="client-detail__upload-btn"
            >
              <UploadCloud size={15} strokeWidth={2} aria-hidden="true" />
              Upload Payment Proof
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
