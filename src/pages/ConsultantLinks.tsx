import { Check, Copy, Link2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getConsultantLinksByFirm } from "../services";
import type { Consultant, ConsultantLinkStatus, ConsultantRole } from "../types";
import "./ConsultantLinks.css";

const ROLE_FILTERS: Array<"All" | ConsultantRole> = ["All", "Sales Manager", "Sales Person"];

export function ConsultantLinks() {
  const { session } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | ConsultantRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ConsultantLinkStatus>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.firmId) return;
    getConsultantLinksByFirm(session.firmId).then((data) => {
      setConsultants(data);
      setLoading(false);
    });
  }, [session?.firmId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return consultants.filter((c) => {
      if (roleFilter !== "All" && c.role !== roleFilter) return false;
      if (statusFilter !== "All" && c.linkStatus !== statusFilter) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [consultants, search, roleFilter, statusFilter]);

  async function handleCopy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
    } catch {
      // clipboard unavailable — the link is still visible to copy manually
    }
  }

  return (
    <div className="consultant-links-page">
      <header className="consultant-links-page__header">
        <h1>Consultant Links</h1>
        <p>Every generated consultant link for your firm — read-only.</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search consultant"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All Roles" : r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <Skeleton height={320} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No consultant links found"
          description="Links are generated automatically when a Sales Manager or Sales Person is added."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultant</th>
                <th>Role</th>
                <th>Link</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const url = `${window.location.origin}/browse?ref=${c.linkCode}`;
                return (
                  <tr key={c.id}>
                    <td className="consultant-links-page__name">{c.name}</td>
                    <td>{c.role}</td>
                    <td>
                      <div className="consultant-links-page__link-cell">
                        <code>{url}</code>
                        <button type="button" onClick={() => handleCopy(c.id, url)}>
                          {copiedId === c.id ? (
                            <Check size={13} strokeWidth={2} aria-hidden="true" />
                          ) : (
                            <Copy size={13} strokeWidth={2} aria-hidden="true" />
                          )}
                          {copiedId === c.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${c.linkStatus === "Active" ? "status-pill--positive" : "status-pill--neutral"}`}
                      >
                        {c.linkStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
