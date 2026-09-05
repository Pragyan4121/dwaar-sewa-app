import api from "@/api/client";

export interface AppNotification {
  id: number;
  user_id: number;
  booking_id: number | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface GetNotificationsResponse {
  message: string;
  notifications: AppNotification[];
  unread_count: number;
  pagination: NotificationPagination;
}

export interface MarkNotificationReadResponse {
  message: string;
  notification: AppNotification;
}

export interface MarkAllNotificationsReadResponse {
  message: string;
  updated_count: number;
}

export interface DeleteNotificationResponse {
  message: string;
}

export async function getMyNotifications(
  params: GetNotificationsParams = {},
): Promise<GetNotificationsResponse> {
  const response = await api.get<GetNotificationsResponse>("/notifications", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      unreadOnly: params.unreadOnly ?? false,
    },
  });

  return response.data;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<MarkNotificationReadResponse> {
  const response = await api.patch<MarkNotificationReadResponse>(
    `/notifications/${notificationId}/read`,
  );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<MarkAllNotificationsReadResponse> {
  const response = await api.patch<MarkAllNotificationsReadResponse>(
    "/notifications/me/read-all",
  );

  return response.data;
}

export async function deleteMyNotification(
  notificationId: number,
): Promise<DeleteNotificationResponse> {
  const response = await api.delete<DeleteNotificationResponse>(
    `/notifications/${notificationId}`,
  );

  return response.data;
}
