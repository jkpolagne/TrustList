import { notifications as seedNotifications } from "../mocks";
import type { ConsultantRole, InternalRole, Notification, NotificationCategory, Session } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.notifications";

const notifications: Notification[] = loadPersisted(STORAGE_KEY, seedNotifications);

export const NOTIFICATIONS_CHANGED_EVENT = "trustlist:notifications-changed";

function persist(): void {
  savePersisted(STORAGE_KEY, notifications);
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

function sortByNewest(list: Notification[]): Notification[] {
  return list.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Every internal role reads its inbox the same way — a consultant (Broker/Sales
 * Manager/Sales Person) is addressed by consultantId, Company Admin has no consultant
 * record so it's addressed by role + firm instead. */
export function getMyNotifications(session: Session): Promise<Notification[]> {
  if (!session.firmId) return withDelay([]);
  const inbox = notifications.filter((n) => {
    if (n.companyId !== session.firmId) return false;
    if (session.consultantId) return n.toConsultantId === session.consultantId;
    return n.toRole === session.role;
  });
  return withDelay(sortByNewest(inbox));
}

export function markNotificationRead(id: string): Promise<Notification | undefined> {
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
    persist();
  }
  return withDelay(notification);
}

export function markAllNotificationsRead(session: Session): Promise<void> {
  notifications.forEach((n) => {
    if (n.companyId !== session.firmId) return;
    const isMine = session.consultantId ? n.toConsultantId === session.consultantId : n.toRole === session.role;
    if (isMine) n.read = true;
  });
  persist();
  return withDelay(undefined);
}

export interface SendNotificationInput {
  companyId: string;
  fromConsultantId: string;
  fromName: string;
  fromRole: ConsultantRole;
  toConsultantId?: string;
  toRole?: InternalRole;
  category: NotificationCategory;
  subject: string;
  message: string;
}

export function sendNotification(input: SendNotificationInput): Promise<Notification> {
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...input,
  };
  notifications.push(notification);
  persist();
  return withDelay(notification);
}
