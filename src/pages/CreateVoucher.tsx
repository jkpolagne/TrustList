import { AlertTriangle, ChevronLeft, FileCheck2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { createVoucher, getEligibleCommissionRequests, type EligibleCommissionRequest } from "../services";
import { round2 } from "../utils/commissionEngine";
import { formatPHP } from "../utils/finance";
import "./CreateVoucher.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function CreateVoucher() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [eligible, setEligible] = useState<EligibleCommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState("");
  const [lessAdcom, setLessAdcom] = useState("0");
  const [lessMiscTax, setLessMiscTax] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  function keyFor(r: EligibleCommissionRequest): string {
    return `${r.client.id}__${r.trancheNumber}__${r.breakdown.role}`;
  }

  useEffect(() => {
    if (!session?.firmId) return;
    getEligibleCommissionRequests(session.firmId).then((data) => {
      setEligible(data);
      setLoading(false);
      const clientParam = searchParams.get("client");
      const trancheParam = searchParams.get("tranche");
      const roleParam = searchParams.get("role");
      if (clientParam && trancheParam && roleParam) {
        const match = data.find(
          (r) =>
            r.client.id === clientParam &&
            r.trancheNumber === Number(trancheParam) &&
            r.breakdown.role === roleParam,
        );
        if (match) setSelectedKey(keyFor(match));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.firmId]);

  const selected = useMemo(
    () => eligible.find((r) => keyFor(r) === selectedKey),
    [eligible, selectedKey],
  );

  const adcomNum = Number(lessAdcom) || 0;
  const miscTaxNum = Number(lessMiscTax) || 0;
  const otherNum = Number(otherDeductions) || 0;

  const totalCommissionDue = selected
    ? round2(selected.breakdown.grossCommission - selected.breakdown.lessEwt - adcomNum)
    : 0;
  const netCommissionReceivable = selected ? round2(totalCommissionDue - miscTaxNum - otherNum) : 0;

  async function handleSubmit() {
    if (!selected || !session?.displayName) return;
    setSubmitting(true);
    const voucher = await createVoucher({
      companyId: selected.client.companyId,
      clientId: selected.client.id,
      developerId: selected.developer.id,
      role: selected.breakdown.role,
      consultantId: selected.breakdown.consultantId,
      saleType: selected.client.saleType,
      trancheNumber: selected.trancheNumber,
      totalTranches: selected.totalTranches,
      paidTo: selected.consultantName,
      buyer: selected.client.name,
      rsDate: selected.client.reservationDate,
      ntcp: selected.client.contractPrice,
      ratePercent: selected.breakdown.ratePercent,
      blockLot: selected.property.title,
      grossCommission: selected.breakdown.grossCommission,
      lessEwt: selected.breakdown.lessEwt,
      lessAdcom: adcomNum,
      lessMiscTax: miscTaxNum,
      otherDeductions: otherNum,
      approvedBy: session.displayName,
    });
    setSubmitting(false);
    navigate(`/app/vouchers/${voucher.id}`);
  }

  if (loading) {
    return (
      <div className="create-voucher-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  return (
    <div className="create-voucher-page">
      <button type="button" className="create-voucher-page__back" onClick={() => navigate("/app/vouchers")}>
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to vouchers
      </button>

      <header className="create-voucher-page__header">
        <h1>Create Commission Voucher</h1>
        <p>Pick a flagged consultant and tranche — the breakdown is computed for you.</p>
      </header>

      {eligible.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Nothing eligible right now"
          description="Every reached tranche in your firm already has a voucher for every entitled role."
        />
      ) : (
        <div className="create-voucher-page__card">
          <div className="admin-form__field">
            <label htmlFor="eligibleSelect">Eligible commission request</label>
            <select id="eligibleSelect" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
              <option value="">Choose a flagged consultant + tranche…</option>
              {eligible.map((r) => (
                <option key={keyFor(r)} value={keyFor(r)}>
                  {r.client.name} — Tranche {r.trancheNumber} of {r.totalTranches} — {r.breakdown.role}
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <div className="create-voucher-page__form">
              {selected.releaseBlocked ? (
                <div className="create-voucher-page__gate-warning">
                  <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
                  This client's requirements checklist isn't Complete yet — the voucher can be
                  created and signed, but release will be blocked until it is.
                </div>
              ) : null}

              <div className="admin-form__section">
                <span className="admin-form__section-title">Sale Details</span>
                <dl className="create-voucher-page__facts">
                  <div>
                    <dt>Developer</dt>
                    <dd>{selected.developer.name}</dd>
                  </div>
                  <div>
                    <dt>Buyer</dt>
                    <dd>{selected.client.name}</dd>
                  </div>
                  <div>
                    <dt>Paid To</dt>
                    <dd>
                      {selected.consultantName} ({selected.breakdown.role})
                    </dd>
                  </div>
                  <div>
                    <dt>RS Date</dt>
                    <dd>{formatDate(selected.client.reservationDate)}</dd>
                  </div>
                  <div>
                    <dt>NTCP</dt>
                    <dd className="money">{formatPHP(selected.client.contractPrice)}</dd>
                  </div>
                  <div>
                    <dt>Release No.</dt>
                    <dd>
                      {selected.trancheNumber} of {selected.totalTranches}
                    </dd>
                  </div>
                  <div>
                    <dt>Rate</dt>
                    <dd>{selected.breakdown.ratePercent}%</dd>
                  </div>
                  <div>
                    <dt>Block/Lot</dt>
                    <dd>{selected.property.title}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-form__section">
                <span className="admin-form__section-title">Commission Computation</span>
                <dl className="create-voucher-page__facts">
                  <div>
                    <dt>Gross Commission</dt>
                    <dd className="money">{formatPHP(selected.breakdown.grossCommission)}</dd>
                  </div>
                  <div>
                    <dt>Less EWT (10%)</dt>
                    <dd className="money">{formatPHP(selected.breakdown.lessEwt)}</dd>
                  </div>
                </dl>

                <div className="admin-form__row">
                  <div className="admin-form__field">
                    <label htmlFor="lessAdcom">Less ADCOM (₱)</label>
                    <input
                      id="lessAdcom"
                      type="number"
                      min={0}
                      value={lessAdcom}
                      onChange={(e) => setLessAdcom(e.target.value)}
                    />
                  </div>
                  <div className="admin-form__field">
                    <label htmlFor="lessMiscTax">Less Misc Tax (₱)</label>
                    <input
                      id="lessMiscTax"
                      type="number"
                      min={0}
                      value={lessMiscTax}
                      onChange={(e) => setLessMiscTax(e.target.value)}
                    />
                  </div>
                  <div className="admin-form__field">
                    <label htmlFor="otherDeductions">Other Deductions (₱)</label>
                    <input
                      id="otherDeductions"
                      type="number"
                      min={0}
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value)}
                    />
                  </div>
                </div>

                <dl className="create-voucher-page__facts create-voucher-page__facts--totals">
                  <div>
                    <dt>Total Commission Due</dt>
                    <dd className="money">{formatPHP(totalCommissionDue)}</dd>
                  </div>
                  <div>
                    <dt>Net Commission Receivable</dt>
                    <dd className="money create-voucher-page__net">{formatPHP(netCommissionReceivable)}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-form__section">
                <span className="admin-form__section-title">Approval</span>
                <p className="admin-form__hint">
                  Approved by <strong>{session?.displayName}</strong> — e-signature captured on submit.
                </p>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-form__submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Creating…" : "Create Voucher"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
