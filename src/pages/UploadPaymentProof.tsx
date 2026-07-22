import { CheckCircle2, ChevronLeft, Paperclip, PartyPopper, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByConsultantIds,
  getConsultantsByFirm,
  getPropertiesByFirm,
  uploadPaymentProof,
} from "../services";
import type { Client, PaymentProofType, Property } from "../types";
import { formatPHP } from "../utils/finance";
import { getScopedConsultantIds } from "../utils/scope";
import "./UploadPaymentProof.css";

type Step = "select" | "details" | "review" | "done";

const PAYMENT_TYPES: PaymentProofType[] = [
  "Reservation Fee",
  "Downpayment",
  "Monthly Amortization",
  "Full Payment",
  "Other",
];

export function UploadPaymentProof() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("client");

  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("select");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState<PaymentProofType>("Monthly Amortization");
  const [proofFilename, setProofFilename] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ newTrancheReached: boolean; trancheNumber: number } | null>(
    null,
  );

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    getConsultantsByFirm(session.firmId).then((consultants) => {
      const scopedIds = getScopedConsultantIds(session.consultantId!, session.role, consultants);
      Promise.all([getClientsByConsultantIds(scopedIds), getPropertiesByFirm(session.firmId!)]).then(
        ([clientsData, propertiesData]) => {
          setClients(clientsData);
          setProperties(propertiesData);
          setLoading(false);
          if (preselectedClientId && clientsData.some((c) => c.id === preselectedClientId)) {
            setClientId(preselectedClientId);
            setStep("details");
          }
        },
      );
    });
  }, [session?.firmId, session?.consultantId, session?.role, preselectedClientId]);

  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const selectedClient = clients.find((c) => c.id === clientId);

  function handleFileChoose() {
    // Mock upload — this prototype has no real file storage, so we just record a filename.
    const mockName = `payment-proof-${Date.now()}.jpg`;
    setProofFilename(mockName);
  }

  async function handleSave() {
    if (!selectedClient || !session?.consultantId) return;
    setSubmitting(true);
    const outcome = await uploadPaymentProof({
      clientId: selectedClient.id,
      amount: Number(amount),
      paymentDate,
      paymentType,
      proofFilename,
      uploadedBy: session.consultantId,
    });
    setSubmitting(false);
    if (outcome) {
      setResult({ newTrancheReached: outcome.newTrancheReached, trancheNumber: outcome.trancheNumber });
      setStep("done");
    }
  }

  function resetFlow() {
    setStep("select");
    setClientId("");
    setAmount("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentType("Monthly Amortization");
    setProofFilename("");
    setResult(null);
  }

  if (loading) {
    return (
      <div className="upload-payment-proof">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No clients to upload for"
        description="Clients assigned to you or your team will appear here once you have some."
      />
    );
  }

  return (
    <div className="upload-payment-proof">
      <header className="upload-payment-proof__header">
        <h1>Upload Payment Proof</h1>
        <p>Record a payment and recompute the client's milestone progress.</p>
      </header>

      <ol className="upload-payment-proof__steps">
        {(["select", "details", "review", "done"] as Step[]).map((s, i) => (
          <li
            key={s}
            className={`upload-payment-proof__step${step === s ? " upload-payment-proof__step--active" : ""}${
              (["select", "details", "review", "done"] as Step[]).indexOf(step) > i
                ? " upload-payment-proof__step--done"
                : ""
            }`}
          >
            {i + 1}. {s === "select" ? "Client" : s === "details" ? "Payment" : s === "review" ? "Review" : "Done"}
          </li>
        ))}
      </ol>

      <div className="upload-payment-proof__card">
        {step === "select" ? (
          <div className="upload-payment-proof__body">
            <div className="admin-form__field">
              <label htmlFor="clientSelect">Select client</label>
              <select
                id="clientSelect"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Choose a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {propertiesById.get(c.propertyId)?.title ?? c.propertyId}
                  </option>
                ))}
              </select>
            </div>
            <div className="upload-payment-proof__actions">
              <button
                type="button"
                className="admin-form__submit"
                disabled={!clientId}
                onClick={() => setStep("details")}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === "details" && selectedClient ? (
          <div className="upload-payment-proof__body">
            <p className="upload-payment-proof__for">
              For <strong>{selectedClient.name}</strong> ·{" "}
              {formatPHP(selectedClient.amountPaid)} of {formatPHP(selectedClient.contractPrice)} paid
              so far
            </p>

            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="payAmount">Payment amount (₱)</label>
                <input
                  id="payAmount"
                  type="number"
                  min={0}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="payDate">Payment date</label>
                <input
                  id="payDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form__field">
              <label htmlFor="payType">Payment type</label>
              <select
                id="payType"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentProofType)}
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form__field">
              <label>Proof of payment</label>
              {proofFilename ? (
                <div className="upload-payment-proof__file-chip">
                  <Paperclip size={14} strokeWidth={2} aria-hidden="true" />
                  {proofFilename}
                </div>
              ) : (
                <button type="button" className="upload-payment-proof__choose-file" onClick={handleFileChoose}>
                  <Upload size={15} strokeWidth={2} aria-hidden="true" />
                  Choose file (mock upload)
                </button>
              )}
            </div>

            <div className="upload-payment-proof__actions">
              <button type="button" className="admin-form__cancel" onClick={() => setStep("select")}>
                Back
              </button>
              <button
                type="button"
                className="admin-form__submit"
                disabled={!amount || Number(amount) <= 0 || !proofFilename}
                onClick={() => setStep("review")}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === "review" && selectedClient ? (
          <div className="upload-payment-proof__body">
            <h3>Review</h3>
            <dl className="upload-payment-proof__review-list">
              <div>
                <dt>Client</dt>
                <dd>{selectedClient.name}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd className="money">{formatPHP(Number(amount) || 0)}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{paymentDate}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{paymentType}</dd>
              </div>
              <div>
                <dt>Proof file</dt>
                <dd>{proofFilename}</dd>
              </div>
            </dl>
            <div className="upload-payment-proof__actions">
              <button type="button" className="admin-form__cancel" onClick={() => setStep("details")}>
                Back
              </button>
              <button type="button" className="admin-form__submit" onClick={handleSave} disabled={submitting}>
                {submitting ? "Saving…" : "Save Payment"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "done" && result ? (
          <div className="upload-payment-proof__done">
            {result.newTrancheReached ? (
              <>
                <PartyPopper size={32} strokeWidth={1.75} aria-hidden="true" />
                <h3>New milestone reached!</h3>
                <p>
                  Tranche {result.trancheNumber} has been recorded and flagged as pending broker
                  voucher action — it now appears in the client's milestone status.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 size={32} strokeWidth={1.75} aria-hidden="true" />
                <h3>Payment recorded</h3>
                <p>No new tranche was reached with this payment — the running total was updated.</p>
              </>
            )}
            <div className="upload-payment-proof__done-actions">
              <Link to={`/app/clients/${selectedClient?.id}`} className="admin-form__submit">
                View Client
              </Link>
              <button type="button" className="admin-form__cancel" onClick={resetFlow}>
                Upload Another
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {step !== "done" ? (
        <Link to="/app/clients" className="upload-payment-proof__cancel-link">
          <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          Cancel and go back to clients
        </Link>
      ) : null}
    </div>
  );
}
