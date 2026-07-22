import { FileCheck2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getDevelopers, getVouchersByFirm, VOUCHER_STATUSES } from "../services";
import type { Developer, Voucher, VoucherStatus } from "../types";
import { formatPHP } from "../utils/finance";
import { voucherStatusPillClass } from "../utils/voucherStatus";
import "./AllVouchers.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function AllVouchers() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([getVouchersByFirm(session.firmId), getDevelopers()]).then(([vouchersData, developersData]) => {
      setVouchers(vouchersData);
      setDevelopers(developersData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vouchers
      .filter((v) => (statusFilter ? v.status === statusFilter : true))
      .filter((v) => (term ? v.buyer.toLowerCase().includes(term) || v.paidTo.toLowerCase().includes(term) : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [vouchers, statusFilter, search]);

  return (
    <div className="all-vouchers-page">
      <header className="all-vouchers-page__header">
        <div>
          <h1>All Commission Vouchers</h1>
          <p>Complete firm-scoped voucher history, one per tranche per entitled role.</p>
        </div>
        <button type="button" className="admin-toolbar__add" onClick={() => navigate("/app/vouchers/new")}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          Create Voucher
        </button>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search buyer or recipient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}
        >
          <option value="">All statuses</option>
          {VOUCHER_STATUSES.map((status: VoucherStatus) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeleton height={360} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No vouchers found"
          description="Vouchers created from eligible commission requests will show up here."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Developer</th>
                <th>Paid To</th>
                <th>Role</th>
                <th>Release No.</th>
                <th className="data-table__numeric">Net Receivable</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} data-clickable="true" onClick={() => navigate(`/app/vouchers/${v.id}`)}>
                  <td className="all-vouchers-page__name">{v.buyer}</td>
                  <td>{developersById.get(v.developerId)?.name ?? "—"}</td>
                  <td>{v.paidTo}</td>
                  <td>{v.role}</td>
                  <td>{v.releaseNumber}</td>
                  <td className="data-table__numeric money">{formatPHP(v.netCommissionReceivable)}</td>
                  <td>
                    <span className={`status-pill ${voucherStatusPillClass(v.status)}`}>{v.status}</span>
                  </td>
                  <td>{formatDate(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
