import axios from "axios";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react-native";

import {
  deleteMyNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/api/notifications";

import { useProviderAuth } from "@/context/ProviderAuthContext";
import { safeBack } from "@/utils/navigation";

interface ApiErrorResponse {
  message?: string;
}

type FilterMode = "all" | "unread";

const PAGE_SIZE = 20;

function formatNotificationDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationIcon(notificationType: string, isRead: boolean) {
  const normalized = notificationType.toLowerCase();

  if (normalized.includes("booking") || normalized.includes("job")) {
    return {
      icon: ChevronRight,
      background: "#EEF4FF",
      color: "#3563E9",
    };
  }

  if (
    normalized.includes("complete") ||
    normalized.includes("success") ||
    normalized.includes("approved")
  ) {
    return {
      icon: CheckCheck,
      background: "#EAF8F1",
      color: "#159A64",
    };
  }

  return {
    icon: isRead ? Bell : BellRing,
    background: isRead ? "#F1F5F9" : "#FFF7E6",
    color: isRead ? "#64748B" : "#B7791F",
  };
}

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const { isProviderAuthenticated } = useProviderAuth();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [filter, setFilter] = useState<FilterMode>("all");

  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const [busyNotificationId, setBusyNotificationId] = useState<number | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");

  const unreadOnly = filter === "unread";

  const loadNotifications = useCallback(
    async ({
      targetPage = 1,
      append = false,
      refreshing = false,
    }: {
      targetPage?: number;
      append?: boolean;
      refreshing?: boolean;
    } = {}) => {
      try {
        setErrorMessage("");

        if (refreshing) {
          setIsRefreshing(true);
        } else if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const result = await getMyNotifications({
          page: targetPage,
          limit: PAGE_SIZE,
          unreadOnly,
        });

        setNotifications((current) =>
          append ? [...current, ...result.notifications] : result.notifications,
        );

        setUnreadCount(result.unread_count);
        setPage(result.pagination.page);
        setHasNextPage(result.pagination.has_next_page);
      } catch (error) {
        console.error("Load notifications error:", error);

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data?.message ?? "Unable to load notifications.",
          );
        } else {
          setErrorMessage("Something went wrong while loading notifications.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    loadNotifications({
      targetPage: 1,
      append: false,
    });
  }, [loadNotifications]);

  async function handleRefresh() {
    await loadNotifications({
      targetPage: 1,
      append: false,
      refreshing: true,
    });
  }

  async function handleLoadMore() {
    if (!hasNextPage || isLoadingMore || isLoading || isRefreshing) {
      return;
    }

    await loadNotifications({
      targetPage: page + 1,
      append: true,
    });
  }

  async function handleMarkRead(notification: AppNotification) {
    if (notification.is_read || busyNotificationId === notification.id) {
      return;
    }

    try {
      setBusyNotificationId(notification.id);

      const result = await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? result.notification : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));

      if (filter === "unread") {
        setNotifications((current) =>
          current.filter((item) => item.id !== notification.id),
        );
      }
    } catch (error) {
      console.error("Mark notification read error:", error);

      setErrorMessage(
        axios.isAxiosError<ApiErrorResponse>(error)
          ? (error.response?.data?.message ??
              "Unable to mark notification as read.")
          : "Unable to mark notification as read.",
      );
    } finally {
      setBusyNotificationId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || isMarkingAll) {
      return;
    }

    try {
      setIsMarkingAll(true);
      setErrorMessage("");

      await markAllNotificationsAsRead();

      setUnreadCount(0);

      if (filter === "unread") {
        setNotifications([]);
      } else {
        setNotifications((current) =>
          current.map((item) => ({
            ...item,
            is_read: true,
            read_at: item.read_at ?? new Date().toISOString(),
          })),
        );
      }
    } catch (error) {
      console.error("Mark all notifications read error:", error);

      setErrorMessage(
        axios.isAxiosError<ApiErrorResponse>(error)
          ? (error.response?.data?.message ??
              "Unable to mark all notifications as read.")
          : "Unable to mark all notifications as read.",
      );
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function performDelete(notification: AppNotification) {
    try {
      setBusyNotificationId(notification.id);
      setErrorMessage("");

      await deleteMyNotification(notification.id);

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      if (!notification.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (error) {
      console.error("Delete notification error:", error);

      setErrorMessage(
        axios.isAxiosError<ApiErrorResponse>(error)
          ? (error.response?.data?.message ?? "Unable to delete notification.")
          : "Unable to delete notification.",
      );
    } finally {
      setBusyNotificationId(null);
    }
  }

  function handleDelete(notification: AppNotification) {
    if (busyNotificationId === notification.id) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm("Delete this notification?")
          : false;

      if (confirmed) {
        void performDelete(notification);
      }

      return;
    }

    Alert.alert(
      "Delete notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void performDelete(notification),
        },
      ],
    );
  }

  async function handleNotificationPress(notification: AppNotification) {
    if (!notification.is_read) {
      await handleMarkRead(notification);
    }

    if (!notification.booking_id) {
      return;
    }

    if (isProviderAuthenticated) {
      router.push(`/provider/booking/${notification.booking_id}`);

      return;
    }

    router.push(`/booking/${notification.booking_id}`);
  }

  const allCount = notifications.length;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#159A64"
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1180,
            alignSelf: "center",
          }}
          className="px-5 py-5"
        >
          {/* TOP BAR */}
          <View className="flex-row items-center justify-between">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-2xl border border-[#E7ECF2] bg-white active:opacity-70"
              onPress={() => safeBack(router, "/(tabs)")}
            >
              <ArrowLeft size={19} color="#132F57" />
            </Pressable>

            <Pressable
              className={`flex-row items-center rounded-2xl border px-4 py-3 ${
                unreadCount > 0
                  ? "border-[#CDEBD9] bg-[#EAF8F1] active:opacity-70"
                  : "border-[#E7ECF2] bg-white"
              }`}
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingAll}
            >
              {isMarkingAll ? (
                <ActivityIndicator size="small" color="#159A64" />
              ) : (
                <>
                  <CheckCheck
                    size={15}
                    color={unreadCount > 0 ? "#159A64" : "#94A3B8"}
                  />

                  <Text
                    className={`ml-2 text-xs font-bold ${
                      unreadCount > 0 ? "text-[#159A64]" : "text-[#94A3B8]"
                    }`}
                  >
                    Mark all read
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* HERO */}
          <View className="mt-5 rounded-[28px] bg-[#132F57] p-5">
            <View
              className={
                isTablet ? "flex-row items-center justify-between" : ""
              }
            >
              <View className="flex-1">
                <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-[#159A64]">
                  <BellRing size={24} color="#FFFFFF" />
                </View>

                <Text
                  className={`mt-4 font-extrabold text-white ${
                    isTablet ? "text-[30px]" : "text-[25px]"
                  }`}
                >
                  Notifications
                </Text>

                <Text className="mt-1 max-w-[520px] text-xs leading-5 text-white/65">
                  Stay updated about bookings, provider activity, job progress
                  and other important Dwaar Sewa updates.
                </Text>
              </View>

              <View className={isTablet ? "ml-6 w-[310px]" : "mt-5"}>
                <View className="rounded-[20px] bg-white/10 p-4">
                  <Text className="text-[10px] font-bold text-white/60">
                    UNREAD NOTIFICATIONS
                  </Text>

                  <Text className="mt-1 text-[30px] font-extrabold text-white">
                    {unreadCount}
                  </Text>

                  <Text className="mt-1 text-[10px] leading-5 text-white/60">
                    Open a notification to mark it as read automatically.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* FILTERS */}
          <View
            className={
              isDesktop ? "mt-5 flex-row items-center justify-between" : "mt-5"
            }
          >
            <View className="flex-row rounded-[18px] border border-[#E7ECF2] bg-white p-1">
              {(
                [
                  {
                    key: "all",
                    label: "All",
                  },
                  {
                    key: "unread",
                    label: `Unread (${unreadCount})`,
                  },
                ] as const
              ).map((item) => {
                const selected = filter === item.key;

                return (
                  <Pressable
                    key={item.key}
                    className={`flex-1 rounded-[14px] px-5 py-3 ${
                      selected ? "bg-[#132F57]" : "bg-white active:opacity-70"
                    }`}
                    onPress={() => setFilter(item.key)}
                  >
                    <Text
                      className={`text-center text-xs font-bold ${
                        selected ? "text-white" : "text-[#64748B]"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              className={`flex-row items-center rounded-2xl border border-[#E7ECF2] bg-white px-4 py-3 active:opacity-70 ${
                isDesktop ? "" : "mt-3 self-start"
              }`}
              onPress={() =>
                void loadNotifications({
                  targetPage: 1,
                })
              }
              disabled={isLoading}
            >
              <RefreshCw size={14} color="#64748B" />

              <Text className="ml-2 text-xs font-bold text-[#64748B]">
                Refresh
              </Text>
            </Pressable>
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="mt-4 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
              <XCircle size={17} color="#BE123C" />

              <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* CONTENT */}
          {isLoading ? (
            <View className="mt-5 items-center rounded-[26px] border border-[#E7ECF2] bg-white py-14">
              <ActivityIndicator color="#159A64" />

              <Text className="mt-3 text-xs text-[#64748B]">
                Loading notifications...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="mt-5 items-center rounded-[28px] border border-[#E7ECF2] bg-white px-6 py-14">
              <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1F5F9]">
                {filter === "unread" ? (
                  <Check size={27} color="#159A64" />
                ) : (
                  <Bell size={27} color="#94A3B8" />
                )}
              </View>

              <Text className="mt-5 text-center text-lg font-extrabold text-[#132F57]">
                {filter === "unread"
                  ? "You’re all caught up"
                  : "No notifications yet"}
              </Text>

              <Text className="mt-2 max-w-[420px] text-center text-xs leading-5 text-[#64748B]">
                {filter === "unread"
                  ? "There are no unread notifications right now."
                  : "Important booking and account updates will appear here when they arrive."}
              </Text>
            </View>
          ) : (
            <View className="mt-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-xs font-extrabold tracking-[1px] text-[#64748B]">
                  {filter === "unread" ? "UNREAD" : "RECENT"} UPDATES
                </Text>

                <Text className="text-[10px] text-[#94A3B8]">
                  {allCount} loaded
                </Text>
              </View>

              {notifications.map((notification) => {
                const iconStyle = getNotificationIcon(
                  notification.notification_type,
                  notification.is_read,
                );

                const Icon = iconStyle.icon;

                const isBusy = busyNotificationId === notification.id;

                return (
                  <View
                    key={notification.id}
                    className={`mb-3 rounded-[24px] border bg-white ${
                      notification.is_read
                        ? "border-[#E7ECF2]"
                        : "border-[#CDEBD9]"
                    }`}
                  >
                    <Pressable
                      className="p-4 active:opacity-80"
                      onPress={() => void handleNotificationPress(notification)}
                    >
                      <View className="flex-row items-start">
                        <View
                          className="h-11 w-11 items-center justify-center rounded-[16px]"
                          style={{
                            backgroundColor: iconStyle.background,
                          }}
                        >
                          <Icon size={18} color={iconStyle.color} />
                        </View>

                        <View className="ml-3 flex-1">
                          <View className="flex-row items-start justify-between">
                            <View className="mr-3 flex-1">
                              <View className="flex-row items-center">
                                <Text className="flex-1 text-sm font-extrabold text-[#132F57]">
                                  {notification.title}
                                </Text>

                                {!notification.is_read ? (
                                  <View className="ml-2 h-2.5 w-2.5 rounded-full bg-[#159A64]" />
                                ) : null}
                              </View>

                              <Text className="mt-1 text-[11px] leading-5 text-[#64748B]">
                                {notification.message}
                              </Text>
                            </View>

                            {notification.booking_id ? (
                              <ChevronRight size={17} color="#94A3B8" />
                            ) : null}
                          </View>

                          <View className="mt-3 flex-row items-center">
                            <Clock3 size={12} color="#94A3B8" />

                            <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                              {formatNotificationDate(notification.created_at)}
                            </Text>

                            {notification.booking_id ? (
                              <View className="ml-3 rounded-full bg-[#EEF4FF] px-2.5 py-1">
                                <Text className="text-[9px] font-bold text-[#3563E9]">
                                  BOOKING #{notification.booking_id}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </Pressable>

                    <View className="mx-4 h-px bg-[#EEF2F6]" />

                    <View className="flex-row items-center justify-end px-4 py-3">
                      {!notification.is_read ? (
                        <Pressable
                          className="mr-2 flex-row items-center rounded-xl bg-[#EAF8F1] px-3 py-2.5 active:opacity-70"
                          onPress={() => void handleMarkRead(notification)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#159A64" />
                          ) : (
                            <>
                              <Check size={13} color="#159A64" />

                              <Text className="ml-1.5 text-[10px] font-bold text-[#159A64]">
                                Mark read
                              </Text>
                            </>
                          )}
                        </Pressable>
                      ) : null}

                      <Pressable
                        className="flex-row items-center rounded-xl bg-[#FFF1F2] px-3 py-2.5 active:opacity-70"
                        onPress={() => handleDelete(notification)}
                        disabled={isBusy}
                      >
                        <Trash2 size={13} color="#BE123C" />

                        <Text className="ml-1.5 text-[10px] font-bold text-[#BE123C]">
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {hasNextPage ? (
                <Pressable
                  className="mt-2 h-14 flex-row items-center justify-center rounded-[20px] border border-[#E2E8F0] bg-white active:opacity-70"
                  onPress={() => void handleLoadMore()}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator color="#159A64" />
                  ) : (
                    <>
                      <RefreshCw size={14} color="#159A64" />

                      <Text className="ml-2 text-xs font-bold text-[#159A64]">
                        Load more notifications
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
