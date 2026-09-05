import { useCallback, useState } from "react";
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
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null) {
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

  const loadBookings = useCallback(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setError(null);

    api
      .get<{ bookings: Booking[] }>("/bookings/me")
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
      // Existing behavior preserved.
    } finally {
      setCancellingId(null);
      setConfirmingCancelId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to see your bookings"
        message="Sign in to an existing account, or create a new one as a customer or a service provider."
      />
    );
  }

  const activeBookings = bookings.filter(
    (booking) =>
      booking.status !== "completed" && booking.status !== "cancelled",
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed",
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
      <FlatList
        data={!loading && !error ? bookings : []}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
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
            <View className="px-5 pt-3">
              <Text className="text-secondary text-[27px] font-extrabold">
                My Bookings
              </Text>

              <Text className="text-muted text-sm mt-1">
                Track and manage your home service requests
              </Text>
            </View>

            {/* SUMMARY */}
            {!loading && !error && bookings.length > 0 && (
              <View
                className={
                  isTablet ? "flex-row px-5 mt-5 gap-3" : "px-5 mt-5 gap-3"
                }
              >
                <View
                  className="bg-[#132F57] rounded-[22px] p-4"
                  style={{
                    flex: isTablet ? 1 : undefined,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center">
                      <Clock size={19} color="#FFFFFF" />
                    </View>

                    <Text className="text-white text-2xl font-extrabold">
                      {activeBookings.length}
                    </Text>
                  </View>

                  <Text className="text-white text-sm font-bold mt-3">
                    Active bookings
                  </Text>

                  <Text className="text-white/60 text-[11px] mt-1">
                    Currently in progress
                  </Text>
                </View>

                <View
                  className="bg-white border border-[#E7ECF2] rounded-[22px] p-4"
                  style={{
                    flex: isTablet ? 1 : undefined,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                      <CheckCircle2 size={19} color="#159A64" />
                    </View>

                    <Text className="text-secondary text-2xl font-extrabold">
                      {completedBookings.length}
                    </Text>
                  </View>

                  <Text className="text-secondary text-sm font-bold mt-3">
                    Completed
                  </Text>

                  <Text className="text-muted text-[11px] mt-1">
                    Successfully finished
                  </Text>
                </View>
              </View>
            )}

            {/* INFO STRIP */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-4">
                <View className="bg-[#FFF3EE] border border-[#FFE0D6] rounded-[20px] px-4 py-3 flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
                    <Sparkles size={17} color="#FFFFFF" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-secondary text-xs font-bold">
                      Live booking updates
                    </Text>

                    <Text className="text-muted text-[10px] mt-0.5">
                      Tap any booking to see full tracking details
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION TITLE */}
            {!loading && !error && bookings.length > 0 && (
              <View className="px-5 mt-7 mb-4">
                <Text className="text-secondary text-xl font-extrabold">
                  Your bookings
                </Text>

                <Text className="text-muted text-xs mt-1">
                  {bookings.length}{" "}
                  {bookings.length === 1 ? "booking" : "bookings"} total
                </Text>
              </View>
            )}

            {/* LOADING */}
            {loading && (
              <View className="px-5 pt-12 items-center">
                <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
                  <ActivityIndicator color="#FF5A3C" />
                </View>

                <Text className="text-muted text-xs mt-3">
                  Loading your bookings...
                </Text>
              </View>
            )}

            {/* ERROR */}
            {!loading && error && (
              <View className="px-5 mt-5">
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
              <View className="bg-white border border-[#E7ECF2] rounded-[28px] px-6 py-12 items-center">
                <View className="w-20 h-20 rounded-[26px] bg-[#FFF3EE] items-center justify-center">
                  <Search size={30} color="#FF5A3C" />
                </View>

                <Text className="text-secondary text-xl font-extrabold mt-5">
                  No bookings yet
                </Text>

                <Text className="text-muted text-sm leading-5 text-center mt-2 max-w-[300px]">
                  Find a trusted professional and book your first home service.
                </Text>

                <Pressable
                  onPress={() => router.push("/(tabs)/services")}
                  className="bg-primary rounded-2xl px-6 py-4 mt-6 flex-row items-center active:opacity-80"
                >
                  <Text className="text-white text-sm font-bold">
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
                <View className="p-5">
                  {/* TOP */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-muted text-[10px] font-bold tracking-wide">
                        BOOKING #{item.id}
                      </Text>

                      <Text
                        className="text-secondary text-lg font-extrabold mt-1"
                        numberOfLines={2}
                      >
                        {item.services.name}
                      </Text>
                    </View>

                    <View
                      className={`px-3 py-1.5 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <Text
                        className={`text-[10px] font-extrabold ${statusStyle.text}`}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* PROGRESS */}
                  {item.status !== "cancelled" && (
                    <View className="mt-4">
                      <View className="h-2 bg-[#EEF2F6] rounded-full overflow-hidden">
                        <View
                          style={{
                            width: `${progress}%`,
                          }}
                          className="h-full bg-primary rounded-full"
                        />
                      </View>

                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-muted text-[10px]">
                          Booking progress
                        </Text>

                        <Text className="text-secondary text-[10px] font-bold">
                          {progress}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* DATE */}
                  <View className="bg-[#F8FAFC] rounded-2xl px-4 py-3 mt-4">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-xl bg-white border border-[#E7ECF2] items-center justify-center">
                        <Calendar size={15} color="#132F57" />
                      </View>

                      <View className="flex-1 ml-2.5">
                        <Text className="text-muted text-[10px]">
                          Scheduled for
                        </Text>

                        <Text className="text-secondary text-xs font-bold mt-0.5">
                          {formatDate(item.preferred_date)}
                        </Text>
                      </View>

                      {item.preferred_time && (
                        <View className="flex-row items-center">
                          <Clock size={14} color="#64748B" />

                          <Text className="text-secondary text-xs font-bold ml-1.5">
                            {formatTime(item.preferred_time)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ADDRESS */}
                  <View className="flex-row items-start mt-4">
                    <View className="w-8 h-8 rounded-xl bg-[#FFF3EE] items-center justify-center">
                      <MapPin size={15} color="#FF5A3C" />
                    </View>

                    <View className="flex-1 ml-2.5">
                      <Text className="text-muted text-[10px]">
                        Service address
                      </Text>

                      <Text className="text-secondary text-xs leading-5 font-semibold mt-0.5">
                        {item.service_address}, {item.service_area}
                      </Text>
                    </View>
                  </View>

                  {/* BOTTOM */}
                  <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-[#EEF2F6]">
                    <View>
                      <Text className="text-muted text-[10px]">
                        Service price
                      </Text>

                      <Text className="text-primary text-lg font-extrabold mt-0.5">
                        ₹{price}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      {canCancel && !isConfirming && (
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            setConfirmingCancelId(item.id);
                          }}
                          className="px-3 py-2 rounded-xl bg-[#FFF1F2] mr-2 active:opacity-70"
                        >
                          <Text className="text-[#DC2626] text-[11px] font-bold">
                            Cancel
                          </Text>
                        </Pressable>
                      )}

                      <View className="flex-row items-center">
                        <Text className="text-primary text-xs font-bold mr-1">
                          View details
                        </Text>

                        <ArrowRight size={14} color="#FF5A3C" />
                      </View>
                    </View>
                  </View>

                  {/* CANCEL CONFIRMATION */}
                  {isConfirming && (
                    <View className="bg-[#FFF7F7] border border-[#FECACA] rounded-2xl px-4 py-4 mt-4">
                      <View className="flex-row items-start">
                        <View className="w-9 h-9 rounded-xl bg-[#FEE2E2] items-center justify-center">
                          <XCircle size={18} color="#DC2626" />
                        </View>

                        <View className="flex-1 ml-3">
                          <Text className="text-secondary text-sm font-bold">
                            Cancel this booking?
                          </Text>

                          <Text className="text-muted text-[11px] leading-5 mt-1">
                            This action cannot be undone.
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row justify-end mt-4 gap-2">
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();

                            setConfirmingCancelId(null);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white"
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
                          className="px-4 py-2.5 rounded-xl bg-[#DC2626] min-w-[108px] items-center"
                        >
                          {cancellingId === item.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text className="text-white text-xs font-bold">
                              Yes, cancel
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* CANCELLATION REASON */}
                  {item.status === "cancelled" && item.cancellation_reason && (
                    <View className="bg-[#FFF7F7] rounded-2xl px-4 py-3 mt-4">
                      <Text className="text-[#991B1B] text-[10px] font-bold">
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

                      <Text className="text-muted text-[10px] ml-1.5">
                        Protected through Dwaar Sewa booking
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
