import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getSellerInquiriesByFirm } from "../services";
import type { SellerInquiry, SellerInquiryStatus } from "../types";
import "./SellerInquiries.css";

const STATUS_CLASS: Record<SellerInquiryStatus, string> = {
  New: "inquiry-status--new",
  Contacted: "inquiry-status--contacted",
  "Converted to Listing": "inquiry-status--converted",
  Declined: "inquiry-status--declined",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SellerInquiries() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    getSellerInquiriesByFirm(session.firmId).then((data) => {
      setInquiries(
        [...data].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        ),
      );
      setLoading(false);
    });
  }, [session?.firmId]);

  return (
    <div className="seller-inquiries-page">
      <header className="seller-inquiries-page__header">
        <h1>Seller Inquiries</h1>
        <p>Property owners who asked your firm to list their property.</p>
      </header>

      {loading ? (
        <Skeleton height={360} />
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No seller inquiries yet"
          description="Submissions from the public 'Sell your property' form will show up here."
        />
      ) : (
        <div className="seller-inquiries-table-wrap">
          <table className="seller-inquiries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Seller</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} onClick={() => navigate(`/app/seller-inquiries/${inquiry.id}`)}>
                  <td>{formatDate(inquiry.submittedAt)}</td>
                  <td className="seller-inquiries-table__name">{inquiry.name}</td>
                  <td>
                    <div className="seller-inquiries-table__contact">
                      <span>{inquiry.contactNumber}</span>
                      <span>{inquiry.email}</span>
                    </div>
                  </td>
                  <td>{inquiry.propertyLocation}</td>
                  <td>{inquiry.propertyType}</td>
                  <td>
                    <span className={`inquiry-status ${STATUS_CLASS[inquiry.status]}`}>
                      {inquiry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
