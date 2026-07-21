import { FileCheck2, ShieldQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import {
  approveListing,
  getPendingVerificationByFirm,
  getReviewedListingsByFirm,
  rejectListing,
} from "../services";
import type { Property } from "../types";
import { formatPHP } from "../utils/finance";
import "./ListingVerification.css";

export function ListingVerification() {
  const { session } = useAuth();
  const [pending, setPending] = useState<Property[]>([]);
  const [reviewed, setReviewed] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    if (!session?.firmId) return;
    Promise.all([
      getPendingVerificationByFirm(session.firmId),
      getReviewedListingsByFirm(session.firmId),
    ]).then(([pendingData, reviewedData]) => {
      setPending(pendingData);
      setReviewed(reviewedData);
      setLoading(false);
    });
  }

  useEffect(reload, [session?.firmId]);

  async function handleApprove(id: string) {
    setBusyId(id);
    await approveListing(id);
    setBusyId(null);
    reload();
  }

  async function handleRejectConfirm(id: string) {
    if (!reason.trim()) return;
    setBusyId(id);
    await rejectListing(id, reason.trim());
    setBusyId(null);
    setRejectingId(null);
    setReason("");
    reload();
  }

  return (
    <div className="listing-verification-page">
      <header className="listing-verification-page__header">
        <h1>Listing Verification</h1>
        <p>
          Individual Seller listings only go live once you verify the submitted ownership
          documents. Developer-sourced listings skip this queue.
        </p>
      </header>

      {loading ? (
        <Skeleton height={280} />
      ) : (
        <>
          <section className="listing-verification-section">
            <h2>Pending Review ({pending.length})</h2>
            {pending.length === 0 ? (
              <EmptyState
                icon={ShieldQuestion}
                title="Nothing awaiting review"
                description="Converted seller inquiries will appear here for ownership verification."
              />
            ) : (
              <div className="listing-verification-grid">
                {pending.map((property) => (
                  <StatusCard key={property.id} accent="amber">
                    <div className="listing-verification-card">
                      <div className="listing-verification-card__top">
                        <div>
                          <span className="listing-verification-card__type">
                            {property.propertyType}
                          </span>
                          <h3>{property.title}</h3>
                          <p className="listing-verification-card__address">{property.address}</p>
                        </div>
                        <div className="listing-verification-card__price money">
                          {formatPHP(property.price)}
                        </div>
                      </div>

                      <div className="listing-verification-card__docs">
                        {(property.verificationDocuments ?? []).map((doc) => (
                          <div key={doc} className="listing-verification-card__doc">
                            <FileCheck2 size={14} strokeWidth={2} aria-hidden="true" />
                            {doc}
                          </div>
                        ))}
                      </div>

                      {rejectingId === property.id ? (
                        <div className="listing-verification-card__reject-form">
                          <label htmlFor={`reason-${property.id}`}>Reason for rejection</label>
                          <textarea
                            id={`reason-${property.id}`}
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Title copy does not match owner ID name"
                          />
                          <div className="listing-verification-card__reject-buttons">
                            <button
                              type="button"
                              className="listing-verification-card__cancel"
                              onClick={() => {
                                setRejectingId(null);
                                setReason("");
                              }}
                              disabled={busyId === property.id}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="listing-verification-card__confirm-reject"
                              onClick={() => handleRejectConfirm(property.id)}
                              disabled={busyId === property.id || !reason.trim()}
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="listing-verification-card__actions">
                          <button
                            type="button"
                            className="listing-verification-card__reject"
                            onClick={() => setRejectingId(property.id)}
                            disabled={busyId === property.id}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="listing-verification-card__approve"
                            onClick={() => handleApprove(property.id)}
                            disabled={busyId === property.id}
                          >
                            {busyId === property.id ? "Approving…" : "Approve"}
                          </button>
                        </div>
                      )}
                    </div>
                  </StatusCard>
                ))}
              </div>
            )}
          </section>

          {reviewed.length > 0 ? (
            <section className="listing-verification-section">
              <h2>Reviewed</h2>
              <div className="listing-verification-grid">
                {reviewed.map((property) => (
                  <StatusCard
                    key={property.id}
                    accent={property.verificationStatus === "Verified" ? "green" : "red"}
                  >
                    <div className="listing-verification-card">
                      <div className="listing-verification-card__top">
                        <div>
                          <span className="listing-verification-card__type">
                            {property.propertyType}
                          </span>
                          <h3>{property.title}</h3>
                          <p className="listing-verification-card__address">{property.address}</p>
                        </div>
                        <div className="listing-verification-card__price money">
                          {formatPHP(property.price)}
                        </div>
                      </div>

                      {property.verificationStatus === "Verified" ? (
                        <VerificationBadge type="ownership" status="verified" />
                      ) : (
                        <p className="listing-verification-card__rejection-reason">
                          Rejected: {property.verificationRejectionReason}
                        </p>
                      )}
                    </div>
                  </StatusCard>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
