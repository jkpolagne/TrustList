import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { getConsultantByLinkCode } from "../services";
import type { Consultant } from "../types";

const STORAGE_KEY = "trustlist.referral";

interface ReferralContextValue {
  /** The consultant the current browsing session is attributed to, if any. */
  consultant: Consultant | null;
}

const ReferralContext = createContext<ReferralContextValue>({ consultant: null });

function readStoredSlug(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSlug(slug: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // ignore — falls back to in-memory only for this session
  }
}

/**
 * Watches for ?ref=<slug> on any public route and attributes the whole
 * browsing session to that consultant — not just the page it first appeared
 * on — by persisting the slug in sessionStorage. Landing on a later page
 * without the query param keeps the earlier attribution instead of losing it.
 */
export function ReferralProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [consultant, setConsultant] = useState<Consultant | null>(null);

  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    const slug = refFromUrl ?? readStoredSlug();
    if (!slug) return;

    getConsultantByLinkCode(slug).then((found) => {
      if (!found) return;
      setConsultant(found);
      if (refFromUrl) storeSlug(refFromUrl);
    });
  }, [searchParams]);

  return <ReferralContext.Provider value={{ consultant }}>{children}</ReferralContext.Provider>;
}

export function useReferral(): ReferralContextValue {
  return useContext(ReferralContext);
}
