import { Calculator, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyPhoto } from "../components/PropertyPhoto";
import { Skeleton } from "../components/Skeleton";
import {
  getDevelopers,
  getFirms,
  getLoanQuotationsByDeveloper,
  getPublicProperties,
} from "../services";
import type { Developer, Firm, LoanQuotation, Property } from "../types";
import { computeMonthlyAmortization, formatPHP } from "../utils/finance";
import "./LoanCalculator.css";

const DOWNPAYMENT_PERCENT = 20;
const INTEREST_RATE_PERCENT = 6.5;
const TERM_YEARS = 15;
const TERM_MONTHS = TERM_YEARS * 12;

type Tab = "manual" | "fixed";

export function LoanCalculator() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("manual");

  const [firms, setFirms] = useState<Firm[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFirms(), getDevelopers(), getPublicProperties()]).then(
      ([firmsData, developersData, propertiesData]) => {
        setFirms(firmsData);
        setDevelopers(developersData);
        setProperties(propertiesData);
        setLoading(false);
      },
    );
  }, []);

  const firmsById = useMemo(() => new Map(firms.map((f) => [f.id, f])), [firms]);

  return (
    <div className="loan-calculator">
      <header className="loan-calculator__intro">
        <h1>Loan Calculator</h1>
        <p>Estimate affordability, or pull a bank's fixed quotation for a specific listing.</p>
      </header>

      <div className="loan-calculator__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "manual"}
          className={`loan-calculator__tab${tab === "manual" ? " loan-calculator__tab--active" : ""}`}
          onClick={() => setTab("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "fixed"}
          className={`loan-calculator__tab${tab === "fixed" ? " loan-calculator__tab--active" : ""}`}
          onClick={() => setTab("fixed")}
        >
          Fixed Quotation
        </button>
      </div>

      {loading ? (
        <Skeleton height={320} />
      ) : tab === "manual" ? (
        <ManualTab properties={properties} firmsById={firmsById} onView={(id) => navigate(`/properties/${id}`)} />
      ) : (
        <FixedQuotationTab developers={developers} properties={properties} />
      )}
    </div>
  );
}

function ManualTab({
  properties,
  firmsById,
  onView,
}: {
  properties: Property[];
  firmsById: Map<string, Firm>;
  onView: (id: string) => void;
}) {
  const [budget, setBudget] = useState("2000000");
  const numericBudget = Number(budget) || 0;

  const downpayment = numericBudget * (DOWNPAYMENT_PERCENT / 100);
  const loanable = numericBudget - downpayment;
  const monthly = numericBudget > 0
    ? computeMonthlyAmortization(loanable, INTEREST_RATE_PERCENT, TERM_MONTHS)
    : 0;

  const matching = useMemo(
    () =>
      properties
        .filter((p) => p.status === "Available" && p.price <= numericBudget)
        .sort((a, b) => b.price - a.price),
    [properties, numericBudget],
  );

  return (
    <div className="loan-calculator__panel">
      <div className="loan-calculator__form">
        <label htmlFor="budget">Total Budget (₱)</label>
        <input
          id="budget"
          type="number"
          min={0}
          step={50000}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <p className="loan-calculator__assumptions">
          Assumes {DOWNPAYMENT_PERCENT}% downpayment, {TERM_YEARS}-year term at{" "}
          {INTEREST_RATE_PERCENT}% annual interest.
        </p>
      </div>

      <div className="loan-calculator__results">
        <div className="loan-calculator__result-card">
          <span>Max Affordable Price</span>
          <strong className="money">{formatPHP(numericBudget)}</strong>
        </div>
        <div className="loan-calculator__result-card">
          <span>Downpayment ({DOWNPAYMENT_PERCENT}%)</span>
          <strong className="money">{formatPHP(downpayment)}</strong>
        </div>
        <div className="loan-calculator__result-card loan-calculator__result-card--highlight">
          <span>Estimated Monthly Amortization</span>
          <strong className="money">{formatPHP(monthly)}</strong>
        </div>
      </div>

      <section className="loan-calculator__matches">
        <h3>Matching Properties</h3>
        {matching.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No properties match this budget"
            description="Try increasing your total budget."
          />
        ) : (
          <div className="loan-calculator__matches-grid">
            {matching.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                firmName={firmsById.get(property.companyId)?.name ?? ""}
                onSelect={onView}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FixedQuotationTab({
  developers,
  properties,
}: {
  developers: Developer[];
  properties: Property[];
}) {
  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const [developerId, setDeveloperId] = useState<string>("");
  const [quotations, setQuotations] = useState<LoanQuotation[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  useEffect(() => {
    if (!developerId) {
      setQuotations([]);
      setPropertyId("");
      return;
    }
    setLoadingQuotations(true);
    getLoanQuotationsByDeveloper(developerId).then((data) => {
      setQuotations(data);
      setPropertyId(data[0]?.propertyId ?? "");
      setLoadingQuotations(false);
    });
  }, [developerId]);

  const selectedQuotation = quotations.find((q) => q.propertyId === propertyId);
  const selectedProperty = propertiesById.get(propertyId);

  return (
    <div className="loan-calculator__panel">
      <div className="loan-calculator__form loan-calculator__form--row">
        <div>
          <label htmlFor="developer">Developer</label>
          <select
            id="developer"
            value={developerId}
            onChange={(e) => setDeveloperId(e.target.value)}
          >
            <option value="">Select a developer…</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="property">Property</label>
          <select
            id="property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={!developerId || quotations.length === 0}
          >
            {quotations.map((q) => (
              <option key={q.propertyId} value={q.propertyId}>
                {propertiesById.get(q.propertyId)?.title ?? q.propertyId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!developerId ? (
        <EmptyState
          icon={Calculator}
          title="Pick a developer to get started"
          description="Choose a developer, then one of their available properties, to view a full bank quotation breakdown."
        />
      ) : loadingQuotations ? (
        <Skeleton height={280} />
      ) : selectedQuotation ? (
        <div className="loan-calculator__sheet">
          <div className="loan-calculator__sheet-media">
            {selectedProperty ? (
              <span className="loan-calculator__sheet-photo">
                <PropertyPhoto property={selectedProperty} />
              </span>
            ) : null}
            <div className="loan-calculator__sheet-specs">
              <strong>{selectedProperty?.title ?? "Selected property"}</strong>
              <span>
                {selectedProperty?.city}
                {selectedProperty?.floorAreaSqm ? ` · ${selectedProperty.floorAreaSqm} sqm floor area` : ""}
                {selectedProperty?.lotAreaSqm ? ` · ${selectedProperty.lotAreaSqm} sqm lot area` : ""}
              </span>
              <span className="loan-calculator__sheet-status">{selectedProperty?.status}</span>
            </div>
          </div>

          <div className="loan-calculator__sheet-content">
            <table className="loan-calculator__breakdown">
              <tbody>
                <tr>
                  <th>Bank / Lender</th>
                  <td>{selectedQuotation.bankName}</td>
                </tr>
                <tr className="loan-calculator__breakdown-highlight">
                  <th>Total Contract Price</th>
                  <td className="money">{formatPHP(selectedQuotation.totalContractPrice)}</td>
                </tr>
                <tr>
                  <th>Reservation Fee</th>
                  <td className="money">{formatPHP(selectedQuotation.reservationFee)}</td>
                </tr>

                <tr>
                  <th colSpan={2} className="loan-calculator__breakdown-section">
                    Downpayment / Equity
                  </th>
                </tr>
                <tr>
                  <th>Downpayment ({selectedQuotation.downpaymentPercent}%)</th>
                  <td className="money">{formatPHP(selectedQuotation.downpaymentAmount)}</td>
                </tr>
                <tr>
                  <th>Balance After Reservation Fee</th>
                  <td className="money">{formatPHP(selectedQuotation.downpaymentBalanceAfterReservation)}</td>
                </tr>
                <tr>
                  <th>Monthly Equity (x {selectedQuotation.downpaymentTermMonths} months)</th>
                  <td className="money">{formatPHP(selectedQuotation.monthlyEquity)}</td>
                </tr>

                <tr>
                  <th colSpan={2} className="loan-calculator__breakdown-section">
                    Bank Financing
                  </th>
                </tr>
                <tr>
                  <th>Loanable Amount</th>
                  <td className="money">{formatPHP(selectedQuotation.loanableAmount)}</td>
                </tr>
                <tr>
                  <th>Interest Rate</th>
                  <td>{selectedQuotation.interestRatePercent}% per annum</td>
                </tr>
                <tr>
                  <th>Misc. Fees</th>
                  <td className="money">{formatPHP(selectedQuotation.miscFeesTotal)}</td>
                </tr>
                <tr>
                  <th colSpan={2} className="loan-calculator__breakdown-note">
                    {selectedQuotation.breakdownDescription}
                  </th>
                </tr>
              </tbody>
            </table>

            <div className="loan-calculator__terms">
              <h3>Monthly Amortization by Term</h3>
              <table className="loan-calculator__breakdown loan-calculator__breakdown--terms">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Monthly Amortization</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuotation.amortizationOptions.map((option) => (
                    <tr
                      key={option.termYears}
                      className={
                        option.termYears * 12 === selectedQuotation.termMonths
                          ? "loan-calculator__breakdown-highlight"
                          : undefined
                      }
                    >
                      <th>{option.termYears} years</th>
                      <td className="money">{formatPHP(option.monthlyAmortization)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="loan-calculator__terms-note">
                Monthly amortization should not exceed 30% of the applicant's gross monthly income.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
