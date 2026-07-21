import { useEffect, useState } from "react";
import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { getFirms, getPublicProperties } from "../services";
import type { Firm, Property } from "../types";
import "./PublicHome.css";

export function PublicHome() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFirms(), getPublicProperties()]).then(([firms, properties]) => {
      setFirms(firms);
      setProperties(properties);
      setLoading(false);
    });
  }, []);

  return (
    <div className="public-home">
      <section className="public-home__hero">
        <h1>Find a home you can verify, not just trust.</h1>
        <p>
          Browse listings from {loading ? "…" : firms.length} participating firms across Naga
          City and Legazpi City. Every listing shows who verified it and how.
        </p>
      </section>

      <div className="public-home__grid">
        <StatusCard
          accent="gold"
          title="Public hub arrives next stage"
          subtitle="Map, search filters, listing details, and the loan calculator are built in Stage 2."
        >
          <p className="public-home__note">
            {loading
              ? "Loading listing counts…"
              : `${properties.length} listings are currently visible across all firms.`}
          </p>
        </StatusCard>

        <StatusCard accent="green" title="Trust badges you'll see on every listing">
          <div className="public-home__badges">
            <VerificationBadge type="prc" status="verified" licenseNumber="0034521" />
            <VerificationBadge type="ownership" status="verified" />
          </div>
        </StatusCard>
      </div>
    </div>
  );
}
