import { Bell } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NOTIFICATIONS_CHANGED_EVENT, getMyNotifications, markNotificationRead } from "../../services";
import type { Notification } from "../../types";
import "./NotificationBell.css";

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function reload() {
    if (!session) return;
    getMyNotifications(session).then(setNotifications);
  }

  useEffect(reload, [session?.firmId, session?.consultantId, session?.role, location.pathname]);

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.firmId, session?.consultantId]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 5);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = 320;
      const panelHeight = 420;
      const left = Math.min(rect.left, window.innerWidth - panelWidth - 12);
      const spaceBelow = window.innerHeight - rect.bottom;
      const style: CSSProperties = { left: Math.max(12, left), width: panelWidth };
      if (spaceBelow >= panelHeight || spaceBelow >= rect.top) {
        style.top = rect.bottom + 8;
        style.maxHeight = Math.max(200, spaceBelow - 16);
      } else {
        style.bottom = window.innerHeight - rect.top + 8;
        style.maxHeight = Math.max(200, rect.top - 16);
      }
      setPanelStyle(style);
    }
    setOpen((v) => !v);
  }

  async function handleItemClick(notification: Notification) {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      reload();
    }
    setOpen(false);
    navigate("/app/notifications");
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="notification-bell__trigger"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell size={17} strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="notification-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-bell__panel" style={panelStyle} role="menu">
          <div className="notification-bell__panel-header">Notifications</div>
          {recent.length === 0 ? (
            <p className="notification-bell__empty">Nothing yet.</p>
          ) : (
            <ul className="notification-bell__list">
              {recent.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notification-bell__item${n.read ? "" : " notification-bell__item--unread"}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className="notification-bell__item-subject">{n.subject}</span>
                    <span className="notification-bell__item-meta">
                      {n.fromName} · {formatRelative(n.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="notification-bell__view-all"
            onClick={() => {
              setOpen(false);
              navigate("/app/notifications");
            }}
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  );
}
