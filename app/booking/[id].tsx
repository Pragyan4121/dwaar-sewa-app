import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  XCircle,
} from "lucide-react-native";

import api from "@/api/client";
import { ErrorState } from "@/components/ErrorState";

import type {
  BookingDetails,
  BookingReview,
  BookingStatus,
  PaymentMethod,
} from "@/types";

import { safeBack } from "@/utils/navigation";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  esewa: "eSewa",
  khalti: "Khalti",
  connectips: "Connect IPS",
};

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

  assigned: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3563E9]",
    border: "border-[#D8E4FF]",
    label: "Provider assigned",
  },

  accepted: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#3563E9]",
    border: "border-[#D8E4FF]",
    label: "Accepted",
  },

  travelling: {
    bg: "bg-[#EEF4FF]",
    text: "text-[#2563EB]",
    border: "border-[#DBEAFE]",
    label: "Provider travelling",
  },

  arrived: {
    bg: "bg-[#ECFDF5]",
    text: "text-[#047857]",
    border: "border-[#D1FAE5]",
    label: "Provider arrived",
  },

  in_progress: {
    bg: "bg-[#F3F0FF]",
    text: "text-[#6D44C5]",
    border: "border-[#E3DCF9]",
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

const ACTIVE_CHAT_STATUSES: BookingStatus[] = [
  "accepted",
  "travelling",
  "arrived",
  "in_progress",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Booking requested",
  assigned: "Provider assigned",
  accepted: "Booking accepted",
  travelling: "Provider travelling",
  arrived: "Provider arrived",
  in_progress: "Service started",
  completed: "Service completed",
  cancelled: "Booking cancelled",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
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
    case "assigned":
      return 35;
    case "accepted":
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

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const [cancelling, setCancelling] = useState(false);

  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadBooking = useCallback(() => {
    setError(null);

    api
      .get<{
        booking: BookingDetails;
      }>(`/bookings/${id}`)
      .then(({ data }) => {
        setBooking(data.booking);
      })
      .catch((err) => {
        setError(
          err?.response?.status === 404
            ? "Booking not found."
            : "Couldn't load this booking.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      loadBooking();
    }, [loadBooking]),
  );

  async function confirmCancel() {
    setCancelling(true);

    try {
      await api.patch(`/bookings/${id}/cancel`, {});

      setBooking((previous) =>
        previous
          ? {
              ...previous,
              status: "cancelled",
            }
          : previous,
      );

      setConfirmingCancel(false);
    } catch (error) {
      console.error("Cancel booking error:", error);
    } finally {
      setCancelling(false);
    }
  }

  async function submitReview() {
    if (rating < 1) {
      setReviewError("Please select a star rating.");
      return;
    }

    setReviewError(null);
    setSubmittingReview(true);

    try {
      const { data } = await api.post<{
        review: BookingReview;
      }>(`/reviews/booking/${id}`, {
        rating,
        comment: comment || undefined,
      });

      setBooking((previous) =>
        previous
          ? {
              ...previous,
              reviews: data.review,
            }
          : previous,
      );
    } catch (error: any) {
      setReviewError(
        error?.response?.data?.message ?? "Couldn't submit your review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator color="#FF5A3C" />
        </View>

        <Text className="text-muted text-xs mt-3">
          Loading booking details...
        </Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center px-5">
        <View className="w-full max-w-[520px] bg-white border border-[#E7ECF2] rounded-[28px] overflow-hidden">
          <ErrorState
            message={error ?? "Booking not found."}
            onRetry={loadBooking}
          />
        </View>
      </View>
    );
  }

  const statusStyle = STATUS_STYLES[booking.status];
  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const canChat = ACTIVE_CHAT_STATUSES.includes(booking.status);

  const provider = booking.users_bookings_provider_idTousers;
  const payment = booking.payments;
  const existingReview = booking.reviews;
  const isOnlinePayment = booking.payment_method !== "cash";

  const isPaymentPending = payment?.payment_status === "pending";

  const isPaymentPaid = payment?.payment_status === "paid";

  const canRetryOnlinePayment =
    booking.status === "completed" && isOnlinePayment && isPaymentPending;

  const price =
    booking.final_price ??
    booking.estimated_price ??
    booking.services.base_price;

  const progress = getStatusProgress(booking.status);

  const phoneProvider = async () => {
    if (!provider?.phone) {
      return;
    }

    const normalized = provider.phone.replace(/[^\d+]/g, "");
    await Linking.openURL(`tel:${normalized}`);
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
      >
        {/* TOP BAR */}
        <View className="px-5 pt-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => safeBack(router, "/(tabs)/bookings")}
              className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
            >
              <ArrowLeft size={20} color="#132F57" />
            </Pressable>

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
        </View>

        {/* HERO */}
        <View className="px-5 mt-4">
          <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
                <Sparkles size={21} color="#FFD166" />
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-white/60 text-[10px] font-bold tracking-wide">
                  BOOKING #{booking.id}
                </Text>

                <Text
                  className={`text-white font-extrabold mt-1 ${
                    isTablet ? "text-[28px] leading-9" : "text-xl leading-7"
                  }`}
                >
                  {booking.services.name}
                </Text>
              </View>
            </View>

            {booking.status !== "cancelled" && (
              <View className="mt-5">
                <View className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <View
                    style={{ width: `${progress}%` }}
                    className="h-full rounded-full bg-primary"
                  />
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-white/60 text-[10px]">
                    Booking progress
                  </Text>

                  <Text className="text-white text-[10px] font-bold">
                    {progress}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* DESKTOP/TABLET LAYOUT */}
        <View
          className={
            isDesktop ? "flex-row px-5 mt-5 gap-5 items-start" : "px-5 mt-5"
          }
        >
          {/* LEFT COLUMN */}
          <View
            style={{
              flex: isDesktop ? 1 : undefined,
            }}
          >
            {/* SCHEDULE */}
            <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                  <Calendar size={18} color="#3563E9" />
                </View>

                <View className="ml-3">
                  <Text className="text-secondary text-sm font-extrabold">
                    Schedule & location
                  </Text>

                  <Text className="text-muted text-[10px] mt-0.5">
                    Your service appointment details
                  </Text>
                </View>
              </View>

              <View className={isTablet ? "flex-row gap-3" : "gap-3"}>
                <View
                  className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4"
                  style={{ flex: 1 }}
                >
                  <View className="flex-row items-center">
                    <Calendar size={15} color="#64748B" />

                    <Text className="text-muted text-[10px] ml-2">Date</Text>
                  </View>

                  <Text className="text-secondary text-sm font-bold mt-2">
                    {formatDate(booking.preferred_date)}
                  </Text>
                </View>

                <View
                  className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4"
                  style={{ flex: 1 }}
                >
                  <View className="flex-row items-center">
                    <Clock size={15} color="#64748B" />

                    <Text className="text-muted text-[10px] ml-2">
                      Preferred time
                    </Text>
                  </View>

                  <Text className="text-secondary text-sm font-bold mt-2">
                    {booking.preferred_time
                      ? formatTime(booking.preferred_time)
                      : "Flexible"}
                  </Text>
                </View>
              </View>

              <View className="bg-[#FFF8F5] border border-[#FFE4DA] rounded-2xl p-4 mt-3">
                <View className="flex-row items-start">
                  <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
                    <MapPin size={16} color="#FF5A3C" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-muted text-[10px]">
                      Service address
                    </Text>

                    <Text className="text-secondary text-sm leading-5 font-semibold mt-1">
                      {booking.service_address}, {booking.service_area}
                    </Text>
                  </View>
                </View>
              </View>

              {booking.notes && (
                <View className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl px-4 py-3 mt-3">
                  <Text className="text-muted text-[10px] font-bold">
                    NOTES
                  </Text>

                  <Text className="text-secondary text-xs leading-5 mt-1">
                    {booking.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* PROVIDER */}
            {provider && (
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                    <UserRound size={18} color="#159A64" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-secondary text-sm font-extrabold">
                      Your provider
                    </Text>

                    <Text className="text-muted text-[10px] mt-0.5">
                      Assigned professional
                    </Text>
                  </View>
                </View>

                <View className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-secondary text-base font-extrabold">
                        {provider.full_name}
                      </Text>

                      {provider.phone ? (
                        <Text className="text-muted text-xs mt-1">
                          {provider.phone}
                        </Text>
                      ) : null}
                    </View>

                    {provider.phone ? (
                      <Pressable
                        onPress={() => void phoneProvider()}
                        className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] items-center justify-center active:opacity-70"
                      >
                        <Phone size={17} color="#FF5A3C" />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {canChat && (
                  <Pressable
                    onPress={() => {
                      router.push(`/chat/${booking.id}`);
                    }}
                    className="mt-3 bg-primary rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                  >
                    <MessageCircle size={18} color="#FFFFFF" />

                    <Text className="text-white font-bold text-sm ml-2">
                      Chat with provider
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* STATUS HISTORY */}
            {booking.booking_status_history?.length > 0 && (
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-center mb-5">
                  <View className="w-10 h-10 rounded-2xl bg-[#F2F4F7] items-center justify-center">
                    <Clock size={18} color="#64748B" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-secondary text-sm font-extrabold">
                      Booking timeline
                    </Text>

                    <Text className="text-muted text-[10px] mt-0.5">
                      Every update in one place
                    </Text>
                  </View>
                </View>

                {booking.booking_status_history.map((entry, index) => {
                  const isLast =
                    index === booking.booking_status_history.length - 1;

                  const isLatest =
                    index === booking.booking_status_history.length - 1;

                  return (
                    <View
                      key={entry.id}
                      className={isLast ? "flex-row" : "flex-row mb-4"}
                    >
                      <View className="items-center mr-3">
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isLatest ? "bg-primary" : "bg-[#EEF2F6]"
                          }`}
                        >
                          {isLatest ? (
                            <Check size={14} color="#FFFFFF" />
                          ) : (
                            <View className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                          )}
                        </View>

                        {!isLast && (
                          <View className="w-px flex-1 bg-[#E2E8F0] mt-1" />
                        )}
                      </View>

                      <View className="flex-1 pb-1">
                        <Text className="text-secondary text-xs font-extrabold">
                          {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                        </Text>

                        <Text className="text-muted text-[10px] mt-1">
                          {formatDateTime(entry.created_at)}
                        </Text>

                        {entry.note && (
                          <Text className="text-muted text-xs leading-5 mt-1.5">
                            {entry.note}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* REVIEW */}
            {booking.status === "completed" && (
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl bg-[#FFF7E6] items-center justify-center">
                    <Star size={18} color="#F59E0B" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-secondary text-sm font-extrabold">
                      {existingReview ? "Your review" : "Rate this service"}
                    </Text>

                    <Text className="text-muted text-[10px] mt-0.5">
                      Your feedback helps improve Dwaar Sewa
                    </Text>
                  </View>
                </View>

                {existingReview ? (
                  <View>
                    <View className="flex-row gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((number) => (
                        <Star
                          key={number}
                          size={22}
                          color="#F59E0B"
                          fill={
                            number <= existingReview.rating ? "#F59E0B" : "none"
                          }
                        />
                      ))}
                    </View>

                    {existingReview.comment && (
                      <View className="bg-[#F8FAFC] rounded-2xl px-4 py-3">
                        <Text className="text-secondary text-sm leading-6">
                          {existingReview.comment}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text className="text-muted text-[10px] mb-2">
                      Tap to rate
                    </Text>

                    <View className="flex-row gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((number) => (
                        <Pressable
                          key={number}
                          onPress={() => setRating(number)}
                          className="w-10 h-10 rounded-xl bg-[#FFF7E6] items-center justify-center active:opacity-70"
                        >
                          <Star
                            size={22}
                            color="#F59E0B"
                            fill={number <= rating ? "#F59E0B" : "none"}
                          />
                        </Pressable>
                      ))}
                    </View>

                    <TextInput
                      value={comment}
                      onChangeText={setComment}
                      placeholder="Share your experience (optional)"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 min-h-[110px] text-secondary text-sm"
                    />

                    {reviewError && (
                      <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl px-4 py-3 mt-3">
                        <Text className="text-[#BE123C] text-xs font-semibold">
                          {reviewError}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      onPress={submitReview}
                      disabled={submittingReview}
                      className={`rounded-2xl py-4 items-center flex-row justify-center mt-4 ${
                        submittingReview
                          ? "bg-primary/70"
                          : "bg-primary active:opacity-80"
                      }`}
                    >
                      {submittingReview ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#FFFFFF" />

                          <Text className="text-white font-bold text-sm ml-2">
                            Submit review
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* RIGHT COLUMN */}
          <View
            style={{
              width: isDesktop ? 390 : "100%",
              marginTop: isDesktop ? 0 : 16,
            }}
          >
            {/* PRICE & PAYMENT */}
            <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                  <Receipt size={18} color="#FF5A3C" />
                </View>

                <View className="ml-3">
                  <Text className="text-secondary text-sm font-extrabold">
                    Price & payment
                  </Text>

                  <Text className="text-muted text-[10px] mt-0.5">
                    Booking payment summary
                  </Text>
                </View>
              </View>

              <View className="bg-[#F8FAFC] rounded-2xl px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-xs">Service price</Text>

                  <Text className="text-primary text-2xl font-extrabold">
                    NPR {price}
                  </Text>
                </View>

                <View className="h-px bg-[#E7ECF2] my-4" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <CreditCard size={15} color="#64748B" />

                    <Text className="text-muted text-xs ml-2">
                      Payment method
                    </Text>
                  </View>

                  <Text className="text-secondary text-xs font-bold">
                    {PAYMENT_METHOD_LABELS[booking.payment_method] ??
                      booking.payment_method}
                  </Text>
                </View>

                {payment ? (
                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-muted text-xs">Payment status</Text>

                    <View
                      className={`px-2.5 py-1 rounded-full ${
                        isPaymentPaid ? "bg-[#EAF8F1]" : "bg-[#FFF7E6]"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold capitalize ${
                          isPaymentPaid ? "text-[#159A64]" : "text-[#B7791F]"
                        }`}
                      >
                        {payment.payment_status}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {booking.status === "completed" &&
              booking.payment_method === "cash" &&
              isPaymentPending ? (
                <View className="mt-4 rounded-2xl border border-[#FDE7B1] bg-[#FFF7E6] p-4">
                  <View className="flex-row items-start">
                    <Clock size={17} color="#B7791F" />

                    <View className="flex-1 ml-2">
                      <Text className="text-[#92400E] text-xs font-extrabold">
                        Waiting for provider confirmation
                      </Text>

                      <Text className="text-[#A16207] text-[10px] leading-5 mt-1">
                        Pay the provider in cash. The payment will be marked
                        Paid after the provider confirms receiving it.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {canRetryOnlinePayment ? (
                <View className="mt-4 rounded-2xl border border-[#D8E4FF] bg-[#EEF4FF] p-4">
                  <View className="flex-row items-start">
                    <CreditCard size={17} color="#3563E9" />

                    <View className="flex-1 ml-2">
                      <Text className="text-[#1D4ED8] text-xs font-extrabold">
                        Payment Pending
                      </Text>

                      <Text className="text-[#3563E9] text-[10px] leading-5 mt-1">
                        Your online payment has not been completed yet. If a
                        previous attempt failed or was cancelled, you can try
                        again.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className="mt-4 rounded-2xl bg-[#3563E9] py-3.5 items-center active:opacity-80"
                    onPress={() => {
                      router.push({
                        pathname: "/payment/[id]",
                        params: {
                          id: String(booking.id),
                          method: booking.payment_method,
                        },
                      } as never);
                    }}
                  >
                    <Text className="text-white text-sm font-bold">
                      Try Again with{" "}
                      {PAYMENT_METHOD_LABELS[booking.payment_method] ??
                        booking.payment_method}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {isPaymentPaid ? (
                <View className="mt-4 rounded-2xl border border-[#CDEBD9] bg-[#EAF8F1] p-4">
                  <View className="flex-row items-center">
                    <CheckCircle2 size={17} color="#159A64" />

                    <View className="flex-1 ml-2">
                      <Text className="text-[#047857] text-xs font-extrabold">
                        Payment completed
                      </Text>

                      <Text className="text-[#047857] text-[10px] leading-5 mt-1">
                        This payment has been successfully confirmed.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <View className="flex-row items-center mt-4">
                <ShieldCheck size={14} color="#159A64" />

                <Text className="text-muted text-[10px] ml-1.5 flex-1">
                  Protected through Dwaar Sewa booking
                </Text>
              </View>
            </View>

            {/* CANCELLATION */}
            {booking.status === "cancelled" && booking.cancellation_reason && (
              <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-2xl bg-[#FEE2E2] items-center justify-center">
                    <XCircle size={18} color="#DC2626" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-[#991B1B] text-sm font-extrabold">
                      Booking cancelled
                    </Text>

                    <Text className="text-[#7F1D1D] text-xs leading-5 mt-1">
                      {booking.cancellation_reason}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* CANCEL ACTION */}
            {canCancel && (
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                {!confirmingCancel ? (
                  <>
                    <Text className="text-secondary text-sm font-extrabold">
                      Need to cancel?
                    </Text>

                    <Text className="text-muted text-xs leading-5 mt-1">
                      You can cancel while this booking is still eligible.
                    </Text>

                    <Pressable
                      onPress={() => setConfirmingCancel(true)}
                      className="border border-[#FCA5A5] bg-[#FFF7F7] rounded-2xl py-3.5 items-center mt-4 active:opacity-70"
                    >
                      <Text className="text-[#DC2626] font-bold text-sm">
                        Cancel booking
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View className="flex-row items-start">
                      <View className="w-10 h-10 rounded-2xl bg-[#FEE2E2] items-center justify-center">
                        <XCircle size={18} color="#DC2626" />
                      </View>

                      <View className="flex-1 ml-3">
                        <Text className="text-secondary text-sm font-extrabold">
                          Cancel this booking?
                        </Text>

                        <Text className="text-muted text-xs leading-5 mt-1">
                          This action cannot be undone.
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2 mt-4">
                      <Pressable
                        onPress={() => setConfirmingCancel(false)}
                        className="flex-1 border border-[#E2E8F0] bg-white rounded-xl py-3 items-center"
                      >
                        <Text className="text-secondary font-bold text-xs">
                          Keep booking
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={confirmCancel}
                        disabled={cancelling}
                        className="flex-1 bg-[#DC2626] rounded-xl py-3 items-center"
                      >
                        {cancelling ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text className="text-white font-bold text-xs">
                            Yes, cancel
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* WAITING FOR PROVIDER */}
            {!provider && booking.status === "pending" && (
              <View className="bg-[#FFF7E6] border border-[#FDE7B1] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center">
                    <Clock size={18} color="#B7791F" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-[#92400E] text-sm font-extrabold">
                      Finding a provider
                    </Text>

                    <Text className="text-[#A16207] text-xs leading-5 mt-1">
                      We&apos;ll notify you as soon as a provider is assigned.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => router.push("/(tabs)/bookings")}
                  className="mt-4 items-center"
                >
                  <Text className="text-[#92400E] text-xs font-bold">
                    Back to my bookings
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
