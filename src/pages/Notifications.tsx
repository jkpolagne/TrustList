import { Bell, Mail, MailOpen, Send } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getConsultantsByFirm,
  getMyNotifications,
  markNotificationRead,
  sendNotification,
} from "../services";
import type { Consultant, InternalRole, Notification, NotificationCategory } from "../types";
import "./Notifications.css";

const CATEGORIES: NotificationCategory[] = [
  "New Listing",
  "New Quotation",
  "New Buyer/Seller Lead",
  "Meeting",
  "General",
];

interface RecipientOption {
  value: string;
  label: string;
  toConsultantId?: string;
  toRole?: InternalRole;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Notifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);

  const [recipientValue, setRecipientValue] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  function reload() {
    if (!session) return;
    Promise.all([
      getMyNotifications(session),
      session.firmId ? getConsultantsByFirm(session.firmId) : Promise.resolve([]),
    ]).then(([notificationsData, consultantsData]) => {
      setNotifications(notificationsData);
      setConsultants(consultantsData);
      setLoading(false);
    });
  }

  useEffect(reload, [session?.firmId, session?.consultantId]);

  const recipients: RecipientOption[] = useMemo(() => {
    if (!session) return [];
    if (session.role === "Broker") {
      const salesManagers = consultants
        .filter((c) => c.role === "Sales Manager")
        .map((c) => ({ value: `consultant:${c.id}`, label: `${c.name} (Sales Manager)`, toConsultantId: c.id }));
      return [
        { value: "role:Company Admin", label: "Company Admin", toRole: "Company Admin" as InternalRole },
        ...salesManagers,
      ];
    }
    if (session.role === "Sales Manager") {
      const broker = consultants.find((c) => c.role === "Broker");
      const team = consultants
        .filter((c) => c.role === "Sales Person" && c.reportsTo === session.consultantId)
        .map((c) => ({ value: `consultant:${c.id}`, label: `${c.name} (Sales Person)`, toConsultantId: c.id }));
      return broker
        ? [{ value: `consultant:${broker.id}`, label: `${broker.name} (Broker)`, toConsultantId: broker.id }, ...team]
        : team;
    }
    return [];
  }, [session, consultants]);

  const canSend = recipients.length > 0;
  const unreadCount = notifications.filter((n) => !n.read).length;

  function resetForm() {
    setRecipientValue("");
    setCategory("General");
    setSubject("");
    setMessage("");
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!session?.consultantId || !session.firmId) return;
    const recipient = recipients.find((r) => r.value === recipientValue);
    if (!recipient) return;

    setSending(true);
    await sendNotification({
      companyId: session.firmId,
      fromConsultantId: session.consultantId,
      fromName: session.displayName,
      fromRole: session.role as "Broker" | "Sales Manager",
      toConsultantId: recipient.toConsultantId,
      toRole: recipient.toRole,
      category,
      subject,
      message,
    });
    setSending(false);
    setComposeOpen(false);
    resetForm();
    reload();
  }

  async function openDetail(notification: Notification) {
    setDetailNotification(notification);
    if (!notification.read) {
      await markNotificationRead(notification.id);
      reload();
    }
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <Skeleton height={28} width="30%" style={{ marginBottom: 20 }} />
        <Skeleton height={320} />
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page__header">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up."}
          </p>
        </div>
        {canSend ? (
          <button type="button" className="notifications-page__compose" onClick={() => setComposeOpen(true)}>
            <Send size={15} strokeWidth={2} aria-hidden="true" />
            New Notification
          </button>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Messages sent to you by your broker or team will show up here."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>From</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr
                  key={n.id}
                  data-clickable="true"
                  className={n.read ? undefined : "notifications-page__row--unread"}
                  onClick={() => openDetail(n)}
                >
                  <td>
                    {n.read ? (
                      <MailOpen size={15} strokeWidth={2} aria-hidden="true" className="notifications-page__read-icon" />
                    ) : (
                      <Mail size={15} strokeWidth={2} aria-hidden="true" className="notifications-page__unread-icon" />
                    )}
                  </td>
                  <td>{n.fromName}</td>
                  <td>
                    <span className="notifications-page__category">{n.category}</span>
                  </td>
                  <td>{n.subject}</td>
                  <td>{formatDateTime(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={composeOpen}
        title="New Notification"
        onClose={() => {
          setComposeOpen(false);
          resetForm();
        }}
        width={520}
      >
        <form className="admin-form" onSubmit={handleSend}>
          <div className="admin-form__field">
            <label htmlFor="notifRecipient">Send to</label>
            <select
              id="notifRecipient"
              required
              value={recipientValue}
              onChange={(e) => setRecipientValue(e.target.value)}
            >
              <option value="">Choose a recipient…</option>
              {recipients.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form__field">
            <label htmlFor="notifCategory">Category</label>
            <select
              id="notifCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as NotificationCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form__field">
            <label htmlFor="notifSubject">Subject</label>
            <input
              id="notifSubject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. New quotation ready for Riverside Homes"
            />
          </div>

          <div className="admin-form__field">
            <label htmlFor="notifMessage">Message</label>
            <textarea
              id="notifMessage"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Details the recipient needs to know"
            />
          </div>

          <div className="admin-form__actions">
            <button
              type="button"
              className="admin-form__cancel"
              onClick={() => {
                setComposeOpen(false);
                resetForm();
              }}
              disabled={sending}
            >
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={sending || !recipientValue}>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailNotification)}
        title={detailNotification?.subject ?? ""}
        onClose={() => setDetailNotification(null)}
        width={520}
      >
        {detailNotification ? (
          <div className="notifications-page__detail">
            <dl className="notifications-page__detail-facts">
              <div>
                <dt>From</dt>
                <dd>
                  {detailNotification.fromName} ({detailNotification.fromRole})
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{detailNotification.category}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatDateTime(detailNotification.createdAt)}</dd>
              </div>
            </dl>
            <p className="notifications-page__detail-message">{detailNotification.message}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
