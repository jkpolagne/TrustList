import { Calculator, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  createLoanQuotation,
  getLoanQuotationsByFirm,
  getPropertiesByFirm,
} from "../services";
import type { LoanQuotation, Property } from "../types";
import { computeMonthlyAmortization, formatPHP } from "../utils/finance";
import "./ManageLoanQuotations.css";

interface QuotationFormState {
  propertyId: string;
  bankName: string;
  interestRatePercent: string;
  downpaymentPercent: string;
  termMonths: string;
  miscFeesTotal: string;
  breakdownDescription: string;
}

const EMPTY_FORM: QuotationFormState = {
  propertyId: "",
  bankName: "",
  interestRatePercent: "6.5",
  downpaymentPercent: "20",
  termMonths: "180",
  miscFeesTotal: "50000",
  breakdownDescription: "",
};

export function ManageLoanQuotations() {
  const { session } = useAuth();
  const [quotations, setQuotations] = useState<LoanQuotation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<QuotationFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function reload() {
    if (!session?.firmId) return;
    Promise.all([getLoanQuotationsByFirm(session.firmId), getPropertiesByFirm(session.firmId)]).then(
      ([quotationsData, propertiesData]) => {
        setQuotations(quotationsData);
        setProperties(propertiesData);
        setLoading(false);
      },
    );
  }

  useEffect(reload, [session?.firmId]);

  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const quotableProperties = useMemo(() => properties.filter((p) => p.developerId), [properties]);
  const quotedPropertyIds = useMemo(() => new Set(quotations.map((q) => q.propertyId)), [quotations]);

  const selectedProperty = propertiesById.get(form.propertyId);
  const listPrice = selectedProperty?.price ?? 0;
  const downpaymentAmount = listPrice * (Number(form.downpaymentPercent || 0) / 100);
  const loanableAmount = listPrice - downpaymentAmount;
  const monthlyPayment = selectedProperty
    ? computeMonthlyAmortization(
        loanableAmount,
        Number(form.interestRatePercent || 0),
        Number(form.termMonths || 1),
      )
    : 0;

  function openAddModal() {
    const firstAvailable = quotableProperties.find((p) => !quotedPropertyIds.has(p.id));
    setForm({ ...EMPTY_FORM, propertyId: firstAvailable?.id ?? "" });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.firmId || !selectedProperty?.developerId) return;
    setSaving(true);
    await createLoanQuotation({
      companyId: session.firmId,
      developerId: selectedProperty.developerId,
      propertyId: selectedProperty.id,
      bankName: form.bankName,
      listPrice: selectedProperty.price,
      downpaymentPercent: Number(form.downpaymentPercent),
      interestRatePercent: Number(form.interestRatePercent),
      termMonths: Number(form.termMonths),
      miscFeesTotal: Number(form.miscFeesTotal),
      breakdownDescription: form.breakdownDescription,
    });
    setSaving(false);
    setModalOpen(false);
    reload();
  }

  return (
    <div className="manage-loan-quotations-page">
      <header className="manage-loan-quotations-page__header">
        <h1>Loan Quotations</h1>
        <p>
          Fixed bank quotations per property — these feed the public hub's Fixed Quotation
          calculator.
        </p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <button type="button" className="admin-toolbar__add" onClick={openAddModal}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          Add Quotation
        </button>
      </div>

      {loading ? (
        <Skeleton height={320} />
      ) : quotations.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No loan quotations yet"
          description="Add a quotation for one of your developer-sourced properties."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Bank</th>
                <th className="data-table__numeric">List Price</th>
                <th className="data-table__numeric">Downpayment</th>
                <th className="data-table__numeric">Rate</th>
                <th className="data-table__numeric">Term</th>
                <th className="data-table__numeric">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td className="manage-loan-quotations-page__property">
                    {propertiesById.get(q.propertyId)?.title ?? q.propertyId}
                  </td>
                  <td>{q.bankName}</td>
                  <td className="data-table__numeric money">{formatPHP(q.listPrice)}</td>
                  <td className="data-table__numeric money">
                    {formatPHP(q.downpaymentAmount)} ({q.downpaymentPercent}%)
                  </td>
                  <td className="data-table__numeric">{q.interestRatePercent}%</td>
                  <td className="data-table__numeric">{q.termMonths} mo.</td>
                  <td className="data-table__numeric money">{formatPHP(q.monthlyAmortization)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title="Add Loan Quotation" onClose={() => setModalOpen(false)}>
        {quotableProperties.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="No developer-sourced properties yet"
            description="Loan quotations need a developer-sourced property to attach to."
          />
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__field">
              <label htmlFor="quotProperty">Property</label>
              <select
                id="quotProperty"
                required
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              >
                <option value="">Select a property…</option>
                {quotableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {quotedPropertyIds.has(p.id) ? " (already has a quotation)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form__field">
              <label>Property price</label>
              <div className="manage-loan-quotations-page__readonly money">
                {selectedProperty ? formatPHP(listPrice) : "—"}
              </div>
            </div>

            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="quotBank">Bank / lender name</label>
                <input
                  id="quotBank"
                  type="text"
                  required
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label htmlFor="quotRate">Interest rate (% p.a.)</label>
                <input
                  id="quotRate"
                  type="number"
                  min={0}
                  step={0.05}
                  required
                  value={form.interestRatePercent}
                  onChange={(e) => setForm({ ...form, interestRatePercent: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="quotDownpaymentPercent">Down payment %</label>
                <input
                  id="quotDownpaymentPercent"
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={form.downpaymentPercent}
                  onChange={(e) => setForm({ ...form, downpaymentPercent: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label>Down payment amount</label>
                <div className="manage-loan-quotations-page__readonly money">
                  {formatPHP(downpaymentAmount)}
                </div>
              </div>
              <div className="admin-form__field">
                <label htmlFor="quotTerm">Term (months)</label>
                <input
                  id="quotTerm"
                  type="number"
                  min={1}
                  required
                  value={form.termMonths}
                  onChange={(e) => setForm({ ...form, termMonths: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form__row">
              <div className="admin-form__field">
                <label htmlFor="quotMiscFees">Misc. fees (₱)</label>
                <input
                  id="quotMiscFees"
                  type="number"
                  min={0}
                  value={form.miscFeesTotal}
                  onChange={(e) => setForm({ ...form, miscFeesTotal: e.target.value })}
                />
              </div>
              <div className="admin-form__field">
                <label>Monthly payment</label>
                <div className="manage-loan-quotations-page__readonly manage-loan-quotations-page__readonly--highlight money">
                  {selectedProperty ? formatPHP(monthlyPayment) : "—"}
                </div>
              </div>
            </div>

            <div className="admin-form__field">
              <label htmlFor="quotBreakdown">Breakdown description</label>
              <textarea
                id="quotBreakdown"
                rows={2}
                required
                placeholder="e.g. 20% downpayment, 15-year fixed term with BDO Home Loans."
                value={form.breakdownDescription}
                onChange={(e) => setForm({ ...form, breakdownDescription: e.target.value })}
              />
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
              <button type="submit" className="admin-form__submit" disabled={saving || !selectedProperty}>
                {saving ? "Saving…" : "Add Quotation"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
