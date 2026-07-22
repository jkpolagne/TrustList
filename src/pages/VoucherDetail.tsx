import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  FileWarning,
  PenLine,
  SearchX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getClientById,
  getConsultantsByFirm,
  getDeveloperById,
  getVoucherById,
  prepareCheck,
  releaseVoucher,
  resubmitVoucher,
  signVoucher,
  disputeVoucher,
} from "../services";
import type { Client, Developer, Voucher } from "../types";
import { isTrancheReleaseBlocked } from "../utils/commissionEngine";
import { formatPHP } from "../utils/finance";
import { getScopedConsultantIds } from "../utils/scope";
import { voucherStatusPillClass } from "../utils/voucherStatus";
import "./VoucherDetail.css";

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function VoucherDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState<Voucher | null | undefined>(undefined);
  const [developer, setDeveloper] = useState<Developer>();
  const [client, setClient] = useState<Client>();
  const [authorized, setAuthorized] = useState(false);
  const [canAct, setCanAct] = useState(false);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [checkNumber, setCheckNumber] = useState("");
  const [bank, setBank] = useState("");
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  function reload() {
    if (!id || !session?.firmId) return;
    getVoucherById(id).then((found) => {
      if (!found) {
        setVoucher(null);
        return;
      }
      getConsultantsByFirm(session.firmId!).then((consultants) => {
        if (session.role === "Broker") {
          setAuthorized(true);
          setCanAct(true);
        } else if (session.consultantId) {
          const scopedIds = getScopedConsultantIds(session.consultantId, session.role, consultants);
          setAuthorized(scopedIds.includes(found.consultantId));
          setCanAct(found.consultantId === session.consultantId);
        }
        setVoucher(found);
      });
      getDeveloperById(found.developerId).then(setDeveloper);
      getClientById(found.clientId).then(setClient);
    });
  }

  useEffect(reload, [id, session?.firmId, session?.consultantId, session?.role]);

  async function handleSign() {
    if (!voucher || !session?.displayName) return;
    setBusy(true);
    await signVoucher(voucher.id, session.displayName);
    setBusy(false);
    reload();
  }

  async function handleDispute() {
    if (!voucher || !disputeReason.trim()) return;
    setBusy(true);
    await disputeVoucher(voucher.id, disputeReason.trim());
    setBusy(false);
    setDisputeOpen(false);
    setDisputeReason("");
    reload();
  }

  async function handleResubmit() {
    if (!voucher) return;
    setBusy(true);
    await resubmitVoucher(voucher.id);
    setBusy(false);
    reload();
  }

  async function handlePrepareCheck() {
    if (!voucher || !checkNumber.trim() || !bank.trim()) return;
    setBusy(true);
    await prepareCheck(voucher.id, checkNumber.trim(), bank.trim(), checkDate);
    setBusy(false);
    setCheckModalOpen(false);
    setCheckNumber("");
    setBank("");
    reload();
  }

  async function handleRelease() {
    if (!voucher) return;
    setBusy(true);
    await releaseVoucher(voucher.id);
    setBusy(false);
    reload();
  }

  if (voucher === undefined) {
    return (
      <div className="voucher-detail">
        <Skeleton height={28} width="30%" style={{ marginBottom: 20 }} />
        <Skeleton height={420} />
      </div>
    );
  }

  if (voucher === null || !authorized) {
    return (
      <EmptyState
        icon={SearchX}
        title="Voucher not found"
        description="This voucher may not exist, or may not belong to you."
      />
    );
  }

  const releaseBlocked = client ? isTrancheReleaseBlocked(client, voucher.trancheNumber) : false;
  const isRecipientRole = session?.role === "Sales Manager" || session?.role === "Sales Person";

  return (
    <div className="voucher-detail">
      <button
        type="button"
        className="voucher-detail__back"
        onClick={() => navigate(session?.role === "Broker" ? "/app/vouchers" : "/app/commission")}
      >
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back
      </button>

      <div className={`voucher-detail__card${voucher.status === "Released" ? " voucher-detail__card--receipt" : ""}`}>
        <div className="voucher-detail__header">
          <div>
            <span className="voucher-detail__eyebrow">
              {voucher.status === "Released" ? "Commission Receipt" : "Commission Voucher"}
            </span>
            <h1>
              {voucher.buyer} — Tranche {voucher.releaseNumber}
            </h1>
          </div>
          <span className={`status-pill ${voucherStatusPillClass(voucher.status)}`}>{voucher.status}</span>
        </div>

        {voucher.status === "Disputed" && voucher.disputeReason ? (
          <div className="voucher-detail__banner voucher-detail__banner--dispute">
            <FileWarning size={16} strokeWidth={2} aria-hidden="true" />
            <div>
              <strong>Disputed by {voucher.receivedBy ?? "consultant"}</strong>
              <p>{voucher.disputeReason}</p>
              <span className="voucher-detail__banner-date">Disputed {formatDate(voucher.disputedAt)}</span>
            </div>
          </div>
        ) : null}

        {releaseBlocked && voucher.status !== "Released" ? (
          <div className="voucher-detail__banner voucher-detail__banner--gate">
            <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
            <span>
              Requirements gate: this client's checklist isn't Complete yet — release will be
              blocked until it is.
            </span>
          </div>
        ) : null}

        <div className="voucher-detail__section">
          <span className="voucher-detail__section-title">Sale Details</span>
          <dl className="voucher-detail__facts">
            <div>
              <dt>Developer</dt>
              <dd>{developer?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Paid To</dt>
              <dd>
                {voucher.paidTo} ({voucher.role})
              </dd>
            </div>
            <div>
              <dt>Buyer</dt>
              <dd>
                {client && isRecipientRole ? (
                  <Link to={`/app/clients/${client.id}`}>{voucher.buyer}</Link>
                ) : (
                  voucher.buyer
                )}
              </dd>
            </div>
            <div>
              <dt>RS Date</dt>
              <dd>{formatDate(voucher.rsDate)}</dd>
            </div>
            <div>
              <dt>NTCP</dt>
              <dd className="money">{formatPHP(voucher.ntcp)}</dd>
            </div>
            <div>
              <dt>Release No.</dt>
              <dd>{voucher.releaseNumber}</dd>
            </div>
            <div>
              <dt>Rate</dt>
              <dd>{voucher.ratePercent}%</dd>
            </div>
            <div>
              <dt>Block/Lot</dt>
              <dd>{voucher.blockLot}</dd>
            </div>
          </dl>
        </div>

        <div className="voucher-detail__section">
          <span className="voucher-detail__section-title">Commission Breakdown</span>
          <dl className="voucher-detail__facts">
            <div>
              <dt>Gross Commission</dt>
              <dd className="money">{formatPHP(voucher.grossCommission)}</dd>
            </div>
            <div>
              <dt>Less EWT (10%)</dt>
              <dd className="money">{formatPHP(voucher.lessEwt)}</dd>
            </div>
            <div>
              <dt>Less ADCOM</dt>
              <dd className="money">{formatPHP(voucher.lessAdcom)}</dd>
            </div>
            <div>
              <dt>Total Commission Due</dt>
              <dd className="money">{formatPHP(voucher.totalCommissionDue)}</dd>
            </div>
            <div>
              <dt>Less Misc Tax</dt>
              <dd className="money">{formatPHP(voucher.lessMiscTax)}</dd>
            </div>
            <div>
              <dt>Other Deductions</dt>
              <dd className="money">{formatPHP(voucher.otherDeductions)}</dd>
            </div>
          </dl>
          <div className="voucher-detail__net">
            <span>Net Commission Receivable</span>
            <strong className="money">{formatPHP(voucher.netCommissionReceivable)}</strong>
          </div>
        </div>

        <div className="voucher-detail__section">
          <span className="voucher-detail__section-title">Check &amp; Signatures</span>
          <dl className="voucher-detail__facts">
            <div>
              <dt>Check Number</dt>
              <dd>{voucher.checkNumber ?? "Not yet prepared"}</dd>
            </div>
            <div>
              <dt>Bank</dt>
              <dd>{voucher.bank ?? "—"}</dd>
            </div>
            <div>
              <dt>Check Date</dt>
              <dd>{formatDate(voucher.checkDate)}</dd>
            </div>
            <div>
              <dt>Date Disbursed</dt>
              <dd>{formatDate(voucher.dateDisbursed)}</dd>
            </div>
            <div>
              <dt>Approved By</dt>
              <dd>
                {voucher.approvedBy}
                <span className="voucher-detail__signed-at"> · signed {formatDate(voucher.approvedSignedAt)}</span>
              </dd>
            </div>
            <div>
              <dt>Received By</dt>
              <dd>
                {voucher.receivedBy ?? "Awaiting signature"}
                {voucher.receivedSignedAt ? (
                  <span className="voucher-detail__signed-at"> · signed {formatDate(voucher.receivedSignedAt)}</span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="voucher-detail__actions">
          {canAct && isRecipientRole && voucher.status === "Pending Signature" ? (
            <>
              <button type="button" className="admin-form__cancel" onClick={() => setDisputeOpen(true)} disabled={busy}>
                Dispute
              </button>
              <button type="button" className="admin-form__submit" onClick={handleSign} disabled={busy}>
                <PenLine size={14} strokeWidth={2} aria-hidden="true" />
                Accept &amp; Sign
              </button>
            </>
          ) : null}

          {session?.role === "Broker" && voucher.status === "Disputed" ? (
            <button type="button" className="admin-form__submit" onClick={handleResubmit} disabled={busy}>
              Resubmit for Signature
            </button>
          ) : null}

          {session?.role === "Broker" && voucher.status === "Signed" ? (
            <button type="button" className="admin-form__submit" onClick={() => setCheckModalOpen(true)} disabled={busy}>
              <Banknote size={14} strokeWidth={2} aria-hidden="true" />
              Prepare Check
            </button>
          ) : null}

          {session?.role === "Broker" && voucher.status === "Check Ready" ? (
            <button
              type="button"
              className="admin-form__submit"
              onClick={handleRelease}
              disabled={busy || releaseBlocked}
              title={releaseBlocked ? "Blocked by the requirements gate until Complete" : undefined}
            >
              <CheckCircle2 size={14} strokeWidth={2} aria-hidden="true" />
              Release
            </button>
          ) : null}
        </div>
      </div>

      <Modal open={disputeOpen} title="Dispute Voucher" onClose={() => setDisputeOpen(false)} width={480}>
        <div className="admin-form">
          <div className="admin-form__field">
            <label htmlFor="disputeReason">Reason</label>
            <textarea
              id="disputeReason"
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="What's wrong with this voucher?"
            />
          </div>
          <div className="admin-form__actions">
            <button type="button" className="admin-form__cancel" onClick={() => setDisputeOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-form__submit"
              onClick={handleDispute}
              disabled={busy || !disputeReason.trim()}
            >
              Submit Dispute
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={checkModalOpen} title="Prepare Check" onClose={() => setCheckModalOpen(false)} width={420}>
        <div className="admin-form">
          <div className="admin-form__field">
            <label htmlFor="checkNumber">Check number</label>
            <input id="checkNumber" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
          </div>
          <div className="admin-form__field">
            <label htmlFor="bank">Bank</label>
            <input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div className="admin-form__field">
            <label htmlFor="checkDate">Check date</label>
            <input id="checkDate" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          </div>
          <div className="admin-form__actions">
            <button type="button" className="admin-form__cancel" onClick={() => setCheckModalOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-form__submit"
              onClick={handlePrepareCheck}
              disabled={busy || !checkNumber.trim() || !bank.trim()}
            >
              Mark Check Ready
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
