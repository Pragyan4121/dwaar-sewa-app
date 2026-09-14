import { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useFocusEffect, useRouter } from "expo-router";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Home,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  XCircle,
} from "lucide-react-native";

import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { ErrorState } from "@/components/ErrorState";
import { SignInPrompt } from "@/components/SignInPrompt";

import type { Booking, BookingStatus } from "@/types";

const STATUS_STYLES: Record<
  BookingStatus,
  {
    bg: string;
    text: string;
    border: string;
    label: string;
  }
> = {
  pending: {
    bg: "bg-[#FFF7E6]",
    text: "text-[#B7791F]",
    border: "border-[#FDE7B1]",
    label: "Pending",
  },

  accepted: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3563E9]",
    border: "border-[#D8E4FF]",
    label: "Accepted",
  },

  assigned: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3563E9]",
    border: "border-[#D8E4FF]",
    label: "Provider assigned",
  },

  travelling: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3563E9]",
    border: "border-[#D8E4FF]",
    label: "Provider on the way",
  },

  arrived: {
    bg: "bg-[#F0F9FF]",
    text: "text-[#0284C7]",
    border: "border-[#D5EEFA]",
    label: "Provider arrived",
  },

  in_progress: {
    bg: "bg-[#F2F0FF]",
    text: "text-[#6842C2]",
    border: "border-[#E1DBFA]",
    label: "In progress",
  },

  completed: {
    bg: "bg-[#EAF8F1]",
    text: "text-[#159A64]",
    border: "border-[#CFEFDE]",
    label: "Completed",
  },

  cancelled: {
    bg: "bg-[#FFF1F2]",
    text: "text-[#DC2626]",
    border: "border-[#FECDD3]",
    label: "Cancelled",
  },
};

const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending",
  "accepted",
  "assigned",
];

type BookingFilter = "all" | "active" | "completed" | "cancelled";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) {
    return null;
  }

  const match = timeStr.match(/(\d{2}):(\d{2})/);

  if (!match) {
    return timeStr;
  }

  const hour = Number(match[1]);

  const period = hour >= 12 ? "PM" : "AM";

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${match[2]} ${period}`;
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `NPR ${value ?? 0}`;
  }

  return `NPR ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusProgress(status: BookingStatus) {
  switch (status) {
    case "pending":
      return 15;

    case "accepted":
      return 30;

    case "assigned":
      return 45;

    case "travelling":
      return 60;

    case "arrived":
      return 75;

    case "in_progress":
      return 90;

    case "completed":
      return 100;

    case "cancelled":
      return 0;

    default:
      return 0;
  }
}

function getProgressText(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Waiting for confirmation";

    case "assigned":
      return "Provider has been assigned";

    case "accepted":
      return "Provider accepted your booking";

    case "travelling":
      return "Provider is travelling to you";

    case "arrived":
      return "Provider has arrived";

    case "in_progress":
      return "Service is currently in progress";

    case "completed":
      return "Service completed";

    case "cancelled":
      return "Booking cancelled";

    default:
      return "Booking status updated";
  }
}

export default function BookingsScreen() {
  const router = useRouter();

  const { isAuthenticated } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;

  const isTablet = width >= 700;

  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [confirmingCancelId, setConfirmingCancelId] = useState<number | null>(
    null,
  );

  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>("all");

  const loadBookings = useCallback(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);

    api
      .get<{
        bookings: Booking[];
      }>("/bookings/me")
      .then(({ data }) => setBookings(data.bookings))
      .catch(() => setError("Couldn't load your bookings."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      loadBookings();
    }, [loadBookings]),
  );

  async function confirmCancel(bookingId: number) {
    setCancellingId(bookingId);

    try {
      await api.patch(`/bookings/${bookingId}/cancel`, {});

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "cancelled",
              }
            : booking,
        ),
      );
    } catch {
      // Preserve current cancellation behavior.
    } finally {
      setCancellingId(null);
      setConfirmingCancelId(null);
    }
  }
  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status !== "completed" && booking.status !== "cancelled",
      ),
    [bookings],
  );

  const completedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed"),
    [bookings],
  );

  const visibleBookings = useMemo(() => {
    if (selectedFilter === "active") {
      return bookings.filter(
        (booking) =>
          booking.status !== "completed" && booking.status !== "cancelled",
      );
    }

    if (selectedFilter === "completed") {
      return bookings.filter((booking) => booking.status === "completed");
    }

    if (selectedFilter === "cancelled") {
      return bookings.filter((booking) => booking.status === "cancelled");
    }

    return bookings;
  }, [bookings, selectedFilter]);

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to see your bookings"
        message="Sign in to an existing account, or create a new one as a customer or a service provider."
      />
    );
  }

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled",
  );

  const filters: {
    key: BookingFilter;
    label: string;
    count: number;
  }[] = [
    {
      key: "all",
      label: "All",
      count: bookings.length,
    },
    {
      key: "active",
      label: "Active",
      count: activeBookings.length,
    },
    {
      key: "completed",
      label: "Completed",
      count: completedBookings.length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: cancelledBookings.length,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]" edges={["top"]}>
      <FlatList
        data={!loading && !error ? visibleBookings : []}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadBookings();
            }}
            tintColor="#FF5A3C"
          />
        }
        ListHeaderComponent={
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
            }}
          >
            {/* HEADER */}
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-primary text-[10px] font-extrabold tracking-[1.6px]">
                    CUSTOMER BOOKINGS
                  </Text>

                  <Text
                    className={`mt-1 text-secondary font-extrabold ${
                      isTablet ? "text-[32px]" : "text-[27px]"
                    }`}
                  >
                    My bookings
                  </Text>

                  <Text className="text-muted text-sm mt-1 leading-5">
                    Track every service request from booking to completion.
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setRefreshing(true);
                    loadBookings();
                  }}
                  disabled={refreshing}
                  className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#FF5A3C" />
                  ) : (
                    <RefreshCw size={17} color="#FF5A3C" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* SUMMARY HERO */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-6">
                <View className="bg-[#132F57] rounded-[30px] p-5 overflow-hidden">
                  <View
                    className={
                      isTablet ? "flex-row items-center justify-between" : ""
                    }
                  >
                    <View className="flex-1">
                      <View className="self-start flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                        <History size={14} color="#FDBA74" />

                        <Text className="ml-2 text-white text-[10px] font-extrabold tracking-[1px]">
                          BOOKING OVERVIEW
                        </Text>
                      </View>

                      <Text className="mt-5 text-white/60 text-xs font-semibold">
                        Active services
                      </Text>

                      <Text className="mt-1 text-white text-[30px] font-extrabold">
                        {activeBookings.length}{" "}
                        {activeBookings.length === 1 ? "booking" : "bookings"}
                      </Text>

                      <Text className="mt-2 text-white/55 text-[10px] leading-5 max-w-[430px]">
                        Keep track of provider assignment, arrival and service
                        progress from this page.
                      </Text>
                    </View>

                    <View className={isTablet ? "w-[360px] ml-6" : "mt-5"}>
                      <View className="bg-white/10 border border-white/10 rounded-[22px] p-4">
                        <View className="flex-row justify-between">
                          <View>
                            <Text className="text-white/50 text-[9px] font-bold">
                              TOTAL
                            </Text>

                            <Text className="mt-1 text-white text-xl font-extrabold">
                              {bookings.length}
                            </Text>
                          </View>

                          <View>
                            <Text className="text-white/50 text-[9px] font-bold">
                              COMPLETED
                            </Text>

                            <Text className="mt-1 text-[#6EE7B7] text-xl font-extrabold">
                              {completedBookings.length}
                            </Text>
                          </View>

                          <View>
                            <Text className="text-white/50 text-[9px] font-bold">
                              CANCELLED
                            </Text>

                            <Text className="mt-1 text-[#FDA4AF] text-xl font-extrabold">
                              {cancelledBookings.length}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* SUMMARY CARDS */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-5">
                <View
                  className={
                    isTablet ? "flex-row" : "flex-row flex-wrap justify-between"
                  }
                >
                  <View
                    className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                    style={{
                      flex: isTablet ? 1 : undefined,
                      width: isTablet ? undefined : "48.5%",
                      marginRight: isTablet ? 10 : 0,
                    }}
                  >
                    <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                      <Clock size={18} color="#3563E9" />
                    </View>

                    <Text className="mt-4 text-secondary text-2xl font-extrabold">
                      {activeBookings.length}
                    </Text>

                    <Text className="mt-1 text-muted text-[10px] font-semibold">
                      Active
                    </Text>
                  </View>

                  <View
                    className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                    style={{
                      flex: isTablet ? 1 : undefined,
                      width: isTablet ? undefined : "48.5%",
                      marginRight: isTablet ? 10 : 0,
                    }}
                  >
                    <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                      <CheckCircle2 size={18} color="#159A64" />
                    </View>

                    <Text className="mt-4 text-secondary text-2xl font-extrabold">
                      {completedBookings.length}
                    </Text>

                    <Text className="mt-1 text-muted text-[10px] font-semibold">
                      Completed
                    </Text>
                  </View>

                  <View
                    className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                    style={{
                      flex: isTablet ? 1 : undefined,
                      width: isTablet ? undefined : "100%",
                    }}
                  >
                    <View className="w-10 h-10 rounded-2xl bg-[#FFF1F2] items-center justify-center">
                      <XCircle size={18} color="#DC2626" />
                    </View>

                    <Text className="mt-4 text-secondary text-2xl font-extrabold">
                      {cancelledBookings.length}
                    </Text>

                    <Text className="mt-1 text-muted text-[10px] font-semibold">
                      Cancelled
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* LIVE INFO */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-1">
                <View className="bg-[#FFF3EE] border border-[#FFE0D6] rounded-[20px] px-4 py-3.5 flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center">
                    <Sparkles size={17} color="#FFFFFF" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-secondary text-xs font-extrabold">
                      Live booking tracking
                    </Text>

                    <Text className="text-muted text-[10px] mt-1">
                      Open any booking to see its complete timeline and details.
                    </Text>
                  </View>

                  <ChevronRight size={17} color="#FF5A3C" />
                </View>
              </View>
            )}

            {/* FILTERS */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-6">
                <View className="flex-row items-end justify-between mb-3">
                  <View>
                    <Text className="text-secondary text-lg font-extrabold">
                      Your bookings
                    </Text>

                    <Text className="text-muted text-[10px] mt-1">
                      Filter your service history
                    </Text>
                  </View>

                  <View className="rounded-full bg-[#EEF4FF] px-3 py-1.5">
                    <Text className="text-[#3563E9] text-[10px] font-extrabold">
                      {visibleBookings.length} shown
                    </Text>
                  </View>
                </View>

                <FlatList
                  data={filters}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(filter) => filter.key}
                  renderItem={({ item: filter, index }) => {
                    const selected = selectedFilter === filter.key;

                    return (
                      <Pressable
                        onPress={() => setSelectedFilter(filter.key)}
                        className={`rounded-full border px-4 py-2.5 ${
                          selected
                            ? "bg-primary border-primary"
                            : "bg-white border-[#E2E8F0]"
                        }`}
                        style={{
                          marginRight: index === filters.length - 1 ? 0 : 8,
                        }}
                      >
                        <Text
                          className={`text-[11px] font-extrabold ${
                            selected ? "text-white" : "text-[#475569]"
                          }`}
                        >
                          {filter.label} {filter.count}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}

            {/* LOADING */}
            {loading && (
              <View className="px-5 pt-14 items-center">
                <View className="w-[70px] h-[70px] rounded-[25px] bg-white border border-[#E7ECF2] items-center justify-center">
                  <ActivityIndicator color="#FF5A3C" />
                </View>

                <Text className="text-secondary text-sm font-bold mt-4">
                  Loading bookings
                </Text>

                <Text className="text-muted text-xs mt-1">
                  Getting your latest service requests...
                </Text>
              </View>
            )}

            {/* ERROR */}
            {!loading && error && (
              <View className="px-5 mt-6">
                <View className="bg-white border border-[#E7ECF2] rounded-[24px] overflow-hidden">
                  <ErrorState message={error} onRetry={loadBookings} />
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View
              style={{
                width: "100%",
                maxWidth: 1180,
                alignSelf: "center",
              }}
              className="px-5 mt-10"
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[28px] px-6 py-14 items-center">
                <View className="w-20 h-20 rounded-[28px] bg-[#FFF3EE] items-center justify-center">
                  {selectedFilter === "all" ? (
                    <Search size={30} color="#FF5A3C" />
                  ) : selectedFilter === "active" ? (
                    <Clock size={30} color="#FF5A3C" />
                  ) : selectedFilter === "completed" ? (
                    <CheckCircle2 size={30} color="#159A64" />
                  ) : (
                    <XCircle size={30} color="#DC2626" />
                  )}
                </View>

                <Text className="text-secondary text-xl font-extrabold mt-5">
                  {bookings.length === 0
                    ? "No bookings yet"
                    : selectedFilter === "active"
                      ? "No active bookings"
                      : selectedFilter === "completed"
                        ? "No completed bookings"
                        : selectedFilter === "cancelled"
                          ? "No cancelled bookings"
                          : "No bookings found"}
                </Text>

                <Text className="text-muted text-sm leading-5 text-center mt-2 max-w-[320px]">
                  {bookings.length === 0
                    ? "Find a trusted professional and book your first home service."
                    : "There are no bookings in this section right now."}
                </Text>

                {bookings.length === 0 ? (
                  <Pressable
                    onPress={() => router.push("/(tabs)/services")}
                    className="bg-primary rounded-2xl px-6 py-4 mt-6 flex-row items-center active:opacity-80"
                  >
                    <Text className="text-white text-sm font-extrabold">
                      Browse services
                    </Text>

                    <ArrowRight
                      size={16}
                      color="#FFFFFF"
                      style={{
                        marginLeft: 7,
                      }}
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setSelectedFilter("all")}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-5 py-3.5 mt-6"
                  >
                    <Text className="text-secondary text-xs font-bold">
                      View all bookings
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item.status];

          const canCancel = CANCELLABLE_STATUSES.includes(item.status);

          const isConfirming = confirmingCancelId === item.id;

          const progress = getStatusProgress(item.status);

          const price =
            item.final_price ??
            item.estimated_price ??
            item.services.base_price;

          return (
            <View
              style={{
                width: "100%",
                maxWidth: isDesktop ? 1180 : undefined,
                alignSelf: "center",
                paddingHorizontal: 20,
              }}
            >
              <Pressable
                onPress={() => router.push(`/booking/${item.id}`)}
                className="bg-white border border-[#E7ECF2] rounded-[26px] mb-4 overflow-hidden active:opacity-80"
              >
                {/* ACCENT */}
                <View
                  className={`h-1 ${
                    item.status === "completed"
                      ? "bg-[#159A64]"
                      : item.status === "cancelled"
                        ? "bg-[#DC2626]"
                        : item.status === "in_progress"
                          ? "bg-[#6842C2]"
                          : "bg-primary"
                  }`}
                />

                <View className="p-5">
                  {/* TOP */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-muted text-[9px] font-extrabold tracking-[1px]">
                        BOOKING #{item.id}
                      </Text>

                      <Text
                        className="text-secondary text-[17px] font-extrabold mt-1"
                        numberOfLines={2}
                      >
                        {item.services.name}
                      </Text>

                      <Text className="text-muted text-[10px] mt-1">
                        {getProgressText(item.status)}
                      </Text>
                    </View>

                    <View
                      className={`px-3 py-1.5 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <Text
                        className={`text-[9px] font-extrabold ${statusStyle.text}`}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* PROGRESS */}
                  {item.status !== "cancelled" && (
                    <View className="mt-5">
                      <View className="h-2 bg-[#EEF2F6] rounded-full overflow-hidden">
                        <View
                          style={{
                            width: `${progress}%`,
                          }}
                          className={`h-full rounded-full ${
                            item.status === "completed"
                              ? "bg-[#159A64]"
                              : item.status === "in_progress"
                                ? "bg-[#6842C2]"
                                : "bg-primary"
                          }`}
                        />
                      </View>

                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-muted text-[9px]">
                          Booking progress
                        </Text>

                        <Text className="text-secondary text-[9px] font-extrabold">
                          {progress}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* DATE / TIME */}
                  <View className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-[20px] px-4 py-4 mt-4">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-xl bg-white border border-[#E7ECF2] items-center justify-center">
                        <Calendar size={15} color="#132F57" />
                      </View>

                      <View className="flex-1 ml-3">
                        <Text className="text-muted text-[9px] font-semibold">
                          SCHEDULED FOR
                        </Text>

                        <Text className="text-secondary text-xs font-extrabold mt-1">
                          {formatDate(item.preferred_date)}
                        </Text>
                      </View>

                      {item.preferred_time ? (
                        <View className="bg-white border border-[#E7ECF2] rounded-xl px-3 py-2">
                          <View className="flex-row items-center">
                            <Clock size={13} color="#64748B" />

                            <Text className="text-secondary text-[10px] font-bold ml-1.5">
                              {formatTime(item.preferred_time)}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* ADDRESS */}
                  <View className="flex-row items-start mt-4">
                    <View className="w-9 h-9 rounded-xl bg-[#FFF3EE] items-center justify-center">
                      <MapPin size={15} color="#FF5A3C" />
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className="text-muted text-[9px] font-semibold">
                        SERVICE ADDRESS
                      </Text>

                      <Text className="text-secondary text-xs leading-5 font-bold mt-1">
                        {item.service_address}, {item.service_area}
                      </Text>
                    </View>
                  </View>

                  {/* PRICE */}
                  <View className="mt-5 bg-[#F8FAFC] border border-[#EEF2F6] rounded-[20px] p-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-muted text-[9px] font-semibold">
                          SERVICE PRICE
                        </Text>

                        <Text className="text-primary text-lg font-extrabold mt-1">
                          {formatMoney(price)}
                        </Text>
                      </View>

                      <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                        <WalletCards size={18} color="#FF5A3C" />
                      </View>
                    </View>
                  </View>

                  {/* ACTIONS */}
                  <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-[#EEF2F6]">
                    <View className="flex-row items-center">
                      {canCancel && !isConfirming && (
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            setConfirmingCancelId(item.id);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-[#FFF1F2] mr-2 active:opacity-70"
                        >
                          <Text className="text-[#DC2626] text-[10px] font-extrabold">
                            Cancel
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-primary text-xs font-extrabold">
                        View details
                      </Text>

                      <ChevronRight
                        size={15}
                        color="#FF5A3C"
                        style={{
                          marginLeft: 3,
                        }}
                      />
                    </View>
                  </View>

                  {/* CANCEL CONFIRMATION */}
                  {isConfirming && (
                    <View className="bg-[#FFF7F7] border border-[#FECACA] rounded-[20px] px-4 py-4 mt-4">
                      <View className="flex-row items-start">
                        <View className="w-10 h-10 rounded-xl bg-[#FEE2E2] items-center justify-center">
                          <XCircle size={18} color="#DC2626" />
                        </View>

                        <View className="flex-1 ml-3">
                          <Text className="text-secondary text-sm font-extrabold">
                            Cancel this booking?
                          </Text>

                          <Text className="text-muted text-[10px] leading-5 mt-1">
                            This booking will be marked cancelled and cannot be
                            restored from this screen.
                          </Text>
                        </View>

                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            setConfirmingCancelId(null);
                          }}
                          className="w-8 h-8 rounded-xl bg-white border border-[#E7ECF2] items-center justify-center"
                        >
                          <X size={13} color="#64748B" />
                        </Pressable>
                      </View>

                      <View className="flex-row justify-end mt-4">
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            setConfirmingCancelId(null);
                          }}
                          className="px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white mr-2"
                        >
                          <Text className="text-secondary text-xs font-bold">
                            Keep booking
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            void confirmCancel(item.id);
                          }}
                          disabled={cancellingId === item.id}
                          className="px-4 py-3 rounded-xl bg-[#DC2626] min-w-[110px] items-center"
                        >
                          {cancellingId === item.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text className="text-white text-xs font-extrabold">
                              Yes, cancel
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* CANCELLATION REASON */}
                  {item.status === "cancelled" && item.cancellation_reason && (
                    <View className="bg-[#FFF7F7] border border-[#FEE2E2] rounded-[18px] px-4 py-3 mt-4">
                      <Text className="text-[#991B1B] text-[9px] font-extrabold">
                        CANCELLATION REASON
                      </Text>

                      <Text className="text-muted text-xs leading-5 mt-1">
                        {item.cancellation_reason}
                      </Text>
                    </View>
                  )}

                  {/* TRUST FOOTER */}
                  {item.status !== "cancelled" && (
                    <View className="flex-row items-center mt-4">
                      <ShieldCheck size={13} color="#159A64" />

                      <Text className="text-muted text-[9px] ml-1.5 flex-1">
                        Protected through Dwaar Sewa booking
                      </Text>

                      <Text className="text-[#159A64] text-[9px] font-bold">
                        Verified service
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
