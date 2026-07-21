import { Building2, History, ShieldPlus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { getFirms, getPlatformLogs } from "../services";
import type { Firm, PlatformLogEntry, PlatformLogEventType } from "../types";
import "./PlatformLogs.css";

const ICON_BY_EVENT: Record<PlatformLogEventType, typeof ShieldPlus> = {
  "Firm Onboarded": ShieldPlus,
  "Firm Status Changed": Building2,
  "Company Admin Created": UserPlus,
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PlatformLogs() {
  const [logs, setLogs] = useState<PlatformLogEntry[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlatformLogs(), getFirms()]).then(([logsData, firmsData]) => {
      setLogs(logsData);
      setFirms(firmsData);
      setLoading(false);
    });
  }, []);

  const firmsById = new Map(firms.map((f) => [f.id, f]));

  return (
    <div className="platform-logs-page">
      <header className="platform-logs-page__header">
        <h1>Platform Logs</h1>
        <p>Firm onboarding and status-change events across the whole platform.</p>
      </header>

      {loading ? (
        <Skeleton height={400} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Onboarding firms and creating Company Admin accounts will show up here."
        />
      ) : (
        <ol className="platform-logs-timeline">
          {logs.map((log) => {
            const Icon = ICON_BY_EVENT[log.eventType];
            const firm = log.firmId ? firmsById.get(log.firmId) : undefined;
            return (
              <li key={log.id} className="platform-logs-timeline__item">
                <div className="platform-logs-timeline__icon">
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="platform-logs-timeline__body">
                  <div className="platform-logs-timeline__top">
                    <span className="platform-logs-timeline__event">{log.eventType}</span>
                    <span className="platform-logs-timeline__time">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p>{log.message}</p>
                  {firm ? <span className="platform-logs-timeline__firm">{firm.name}</span> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
