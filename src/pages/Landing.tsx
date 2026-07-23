import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  Handshake,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { APP_NAME } from "../config";
import { getFirms, getPublicProperties } from "../services";
import type { Firm } from "../types";
import "./Landing.css";

function withDelay<T>(value: T, ms = 350 + Math.random() * 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function Landing() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const [partnerName, setPartnerName] = useState("");
  const [partnerFirm, setPartnerFirm] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerMessage, setPartnerMessage] = useState("");
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([getFirms(), getPublicProperties()]).then(([firmsData, properties]) => {
      setFirms(firmsData);
      setListingCount(properties.length);
      setLoadingStats(false);
    });
  }, []);

  async function handlePartnerSubmit(e: FormEvent) {
    e.preventDefault();
    setPartnerSubmitting(true);
    await withDelay(null);
    setPartnerSubmitting(false);
    setPartnerSubmitted(true);
  }

  return (
    <div className="landing-page">
      {/* 1. Hero */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <span className="landing-hero__eyebrow">
            <MapPin size={13} strokeWidth={2} aria-hidden="true" />
            Naga City · Camarines Sur
          </span>
          <h1>Real estate you can verify, not just take someone's word for.</h1>
          <p className="landing-hero__subtitle">
            Browse listings from multiple licensed firms in one place — every agent's PRC status
            and every listing's ownership documents are visible before you ever pick up the phone.
          </p>

          <div className="landing-hero__ctas">
            <Link to="/browse" className="landing-hero__cta landing-hero__cta--primary">
              Browse properties
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link to="/sell" className="landing-hero__cta landing-hero__cta--secondary">
              Sell your property
            </Link>
          </div>

          <div className="landing-hero__stats">
            {loadingStats ? (
              <>
                <Skeleton height={40} width={120} />
                <Skeleton height={40} width={120} />
                <Skeleton height={40} width={160} />
              </>
            ) : (
              <>
                <div className="landing-hero__stat">
                  <strong>{listingCount}</strong>
                  <span>Active listings</span>
                </div>
                <div className="landing-hero__stat">
                  <strong>{firms.length}</strong>
                  <span>Participating firms</span>
                </div>
                <div className="landing-hero__stat">
                  <strong>3</strong>
                  <span>Cities covered</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Trust story */}
      <section className="landing-section landing-trust">
        <header className="landing-section__header">
          <h2>Trust built into every listing</h2>
          <p>Three things you'd normally have to just believe — here, you can see them.</p>
        </header>

        <div className="landing-trust__grid">
          <div className="landing-trust__card">
            <h3>Agents you can check</h3>
            <p>
              Every consultant's PRC license status is shown right on the listing — verified,
              pending, or not shown at all if it isn't confirmed.
            </p>
            <div className="landing-trust__badge">
              <VerificationBadge type="prc" status="verified" licenseNumber="0034521" />
            </div>
          </div>

          <div className="landing-trust__card">
            <h3>Ownership you can check</h3>
            <p>
              Individually-owned listings only go public after the firm reviews the title copy
              and owner ID — you'll see the badge, not just a promise.
            </p>
            <div className="landing-trust__badge">
              <VerificationBadge type="ownership" status="verified" />
            </div>
          </div>

          <div className="landing-trust__card">
            <h3>Transactions you can follow</h3>
            <p>
              Once you're a client, payment milestones are visible to your agent and their broker
              at the same time, the moment the system detects them — never just one side's word.
            </p>
            <div className="landing-trust__chip">
              <Eye size={14} strokeWidth={2} aria-hidden="true" />
              Milestone visibility, live
            </div>
          </div>
        </div>
      </section>

      {/* 3. For Buyers / For Sellers */}
      <section className="landing-band">
        <div className="landing-section landing-split">
          <div className="landing-split__col">
            <span className="landing-split__eyebrow">For Buyers</span>
            <h2>Shop with your eyes open</h2>
            <ul className="landing-split__list">
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                See every agent's PRC license before you ever inquire.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                Compare listings from multiple firms on one map, side by side.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                Once you buy, track your own payment milestones — the same view your agent sees.
              </li>
            </ul>
            <Link to="/browse" className="landing-split__link">
              Browse properties
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          <div className="landing-split__divider" aria-hidden="true" />

          <div className="landing-split__col">
            <span className="landing-split__eyebrow">For Sellers</span>
            <h2>List through a firm, not a stranger</h2>
            <ul className="landing-split__list">
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                A licensed firm verifies your ownership documents before anything goes public.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                Buyers see your Ownership Verified badge — fewer doubts, faster interest.
              </li>
              <li>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                Submit one inquiry; the firm follows up. No back-and-forth chat required.
              </li>
            </ul>
            <Link to="/sell" className="landing-split__link">
              Sell your property
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. For real estate firms */}
      <section className="landing-section landing-partner">
        <div className="landing-partner__pitch">
          <span className="landing-split__eyebrow">For Real Estate Firms</span>
          <h2>Bring your listings and your agents onto one trusted hub</h2>
          <p>
            Join {APP_NAME} alongside other licensed firms in the region. Your properties reach
            more buyers, your agents' PRC verification builds instant credibility, and every
            commission voucher your team processes is tracked from milestone to release — no
            more chasing paperwork.
          </p>
          <ul className="landing-partner__list">
            <li>Your own scoped dashboard — developers, listings, consultants, and payouts.</li>
            <li>Multi-firm buyer traffic, not a closed listing silo.</li>
            <li>Built-in verification workflow for individually-owned listings.</li>
          </ul>
        </div>

        <div className="landing-partner__card">
          <div className="landing-partner__card-header">
            <Handshake size={18} strokeWidth={2} aria-hidden="true" />
            <h3>Partner with us</h3>
          </div>

          {partnerSubmitted ? (
            <div className="landing-partner__confirmation">
              <CheckCircle2 size={28} strokeWidth={1.75} aria-hidden="true" />
              <p>
                Thanks, {partnerName || "there"} — our team will reach out to{" "}
                {partnerEmail || "your email"} shortly to talk next steps.
              </p>
            </div>
          ) : (
            <form className="landing-partner__form" onSubmit={handlePartnerSubmit}>
              <div className="landing-partner__field">
                <label htmlFor="partnerName">Your name</label>
                <input
                  id="partnerName"
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
              </div>
              <div className="landing-partner__field">
                <label htmlFor="partnerFirm">Firm name</label>
                <input
                  id="partnerFirm"
                  type="text"
                  required
                  value={partnerFirm}
                  onChange={(e) => setPartnerFirm(e.target.value)}
                />
              </div>
              <div className="landing-partner__field">
                <label htmlFor="partnerEmail">Email</label>
                <input
                  id="partnerEmail"
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
              </div>
              <div className="landing-partner__field">
                <label htmlFor="partnerMessage">Message (optional)</label>
                <textarea
                  id="partnerMessage"
                  rows={3}
                  value={partnerMessage}
                  onChange={(e) => setPartnerMessage(e.target.value)}
                  placeholder="Tell us about your firm and your listings"
                />
              </div>
              <button type="submit" className="landing-partner__submit" disabled={partnerSubmitting}>
                {partnerSubmitting ? "Sending…" : "Request a call"}
              </button>
              <p className="landing-partner__hint">
                <Mail size={12} strokeWidth={2} aria-hidden="true" />
                No live chat — we follow up by email or phone within 2 business days.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* 5. Participating firms */}
      <section className="landing-section landing-firms">
        <header className="landing-section__header landing-section__header--compact">
          <h2>Participating firms</h2>
        </header>

        {loadingStats ? (
          <div className="landing-firms__grid">
            <Skeleton height={84} />
            <Skeleton height={84} />
            <Skeleton height={84} />
          </div>
        ) : (
          <div className="landing-firms__grid">
            {firms.map((firm) => (
              <div key={firm.id} className="landing-firms__card">
                <span className="landing-firms__mark">{firm.code}</span>
                <span className="landing-firms__text">
                  <strong>{firm.name}</strong>
                  <span>{firm.city}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <span className="landing-footer__brand-mark">
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
              {APP_NAME}
            </span>
            <p>A verified real estate marketplace for Naga City and the Bicol Region.</p>
          </div>

          <div className="landing-footer__col">
            <span className="landing-footer__col-title">Explore</span>
            <Link to="/browse">Browse Listings</Link>
            <Link to="/loan-calculator">Loan Calculator</Link>
            <Link to="/property-valuation">Property Valuation</Link>
            <Link to="/sell">Sell Your Property</Link>
          </div>

          <div className="landing-footer__col">
            <span className="landing-footer__col-title">Company</span>
            <span className="landing-footer__placeholder">About</span>
            <span className="landing-footer__placeholder">Careers</span>
            <span className="landing-footer__placeholder">Contact</span>
          </div>

          <div className="landing-footer__col">
            <span className="landing-footer__col-title">Legal</span>
            <span className="landing-footer__placeholder">Privacy Policy</span>
            <span className="landing-footer__placeholder">Terms of Service</span>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <Building2 size={13} strokeWidth={2} aria-hidden="true" />
          <span>© 2026 {APP_NAME}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
