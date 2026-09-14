import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";

import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react-native";

import {
  acceptProviderBooking,
  completeProviderBooking,
  confirmProviderCashPaymentReceived,
  getProviderBookingDetails,
  markProviderBookingArrived,
  markProviderBookingTravelling,
  rejectProviderBooking,
  startProviderBooking,
} from "@/api/provider-bookings";

import type { ProviderBookingDetails } from "@/types";

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `NPR ${value ?? 0}`;
  }

  return `NPR ${amount.toLocaleString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Flexible";
  }

  const match = value.match(/(\d{2}):(\d{2})/);

  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${match[2]} ${period}`;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  destructive = false,
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return {
        container: "bg-[#EAF8F1]",
        text: "text-[#159A64]",
        border: "border-[#CDEBD9]",
      };

    case "in_progress":
    case "travelling":
      return {
        container: "bg-[#EEF4FF]",
        text: "text-[#3563E9]",
        border: "border-[#D8E4FF]",
      };

    case "arrived":
      return {
        container: "bg-[#ECFDF5]",
        text: "text-[#047857]",
        border: "border-[#D1FAE5]",
      };

    case "accepted":
    case "assigned":
      return {
        container: "bg-[#F3F0FF]",
        text: "text-[#6D44C5]",
        border: "border-[#E5DDFC]",
      };

    case "cancelled":
      return {
        container: "bg-[#FFF1F2]",
        text: "text-[#DC2626]",
        border: "border-[#FECDD3]",
      };

    default:
      return {
        container: "bg-[#FFF7E6]",
        text: "text-[#B7791F]",
        border: "border-[#FDE7B1]",
      };
  }
}

function getStatusProgress(status: string) {
  switch (status) {
    case "pending":
      return 15;
    case "assigned":
      return 35;
    case "accepted":
      return 50;
    case "travelling":
      return 65;
    case "arrived":
      return 78;
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

export default function ProviderBookingDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const bookingId =
    typeof params.id === "string" ? Number(params.id) : Number.NaN;

  const [booking, setBooking] = useState<ProviderBookingDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [finalPrice, setFinalPrice] = useState("");

  const loadBooking = useCallback(
    async (refresh = false) => {
      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        setErrorMessage("Invalid booking ID.");
        setIsLoading(false);
        return;
      }

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage("");

        const result = await getProviderBookingDetails(bookingId);

        setBooking(result);

        if (result.final_price !== null && result.final_price !== undefined) {
          setFinalPrice(String(result.final_price));
        } else if (
          result.estimated_price !== null &&
          result.estimated_price !== undefined
        ) {
          setFinalPrice(String(result.estimated_price));
        }

        if (refresh) {
          setSuccessMessage("Booking refreshed.");
        }
      } catch (error) {
        console.error("Load provider booking details error:", error);

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data?.message ?? "Unable to load booking details.",
          );
        } else {
          setErrorMessage("Unable to load booking details.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  async function handleAccept() {
    if (!booking || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await acceptProviderBooking(booking.id);

      setSuccessMessage("Booking accepted successfully.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to accept the booking.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!booking || isProcessing) {
      return;
    }

    confirmAction(
      "Dismiss booking",
      "This booking will remain available to other providers. Continue?",
      "Dismiss",
      () => {
        void performReject();
      },
      true,
    );
  }

  async function performReject() {
    if (!booking) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await rejectProviderBooking(booking.id);

      router.replace("/provider/bookings");
    } catch (error) {
      handleActionError(error, "Unable to dismiss the booking.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleTravelling() {
    if (!booking || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await markProviderBookingTravelling(booking.id);

      setSuccessMessage("You are now travelling to the customer.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to mark the booking as travelling.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleArrived() {
    if (!booking || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await markProviderBookingArrived(booking.id);

      setSuccessMessage("Arrival confirmed successfully.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to mark the booking as arrived.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleStart() {
    if (!booking || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await startProviderBooking(booking.id);

      setSuccessMessage("Job started successfully.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to start the job.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCompleteConfirmation() {
    if (!booking || isProcessing) {
      return;
    }

    const parsedFinalPrice = Number(finalPrice);

    if (!Number.isFinite(parsedFinalPrice) || parsedFinalPrice < 0) {
      setErrorMessage("Enter a valid final price.");
      return;
    }

    confirmAction(
      "Complete job",
      `Confirm completion with final price ${formatMoney(parsedFinalPrice)}?`,
      "Complete",
      () => {
        void performComplete(parsedFinalPrice);
      },
    );
  }

  async function performComplete(parsedFinalPrice: number) {
    if (!booking) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await completeProviderBooking(booking.id, parsedFinalPrice);

      setSuccessMessage("Job completed successfully.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to complete the job.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleActionError(error: unknown, fallbackMessage: string) {
    console.error("Provider booking action error:", error);

    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      setErrorMessage(error.response?.data?.message ?? fallbackMessage);
      return;
    }

    setErrorMessage(fallbackMessage);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading job details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <View className="w-full max-w-[480px] bg-white border border-[#E7ECF2] rounded-[28px] p-7 items-center">
          <View className="w-16 h-16 rounded-[22px] bg-[#FFF1F2] items-center justify-center">
            <XCircle size={28} color="#DC2626" />
          </View>

          <Text className="mt-5 text-center text-xl font-extrabold text-[#132F57]">
            Booking unavailable
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-[#64748B]">
            {errorMessage || "This booking could not be loaded."}
          </Text>

          <Pressable
            className="mt-6 w-full rounded-2xl bg-[#159A64] py-4 items-center active:opacity-80"
            onPress={() => router.replace("/provider/bookings")}
          >
            <Text className="font-bold text-white">Return to Jobs</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  function handleCashPaymentReceivedConfirmation() {
    if (!booking || isProcessing) {
      return;
    }

    confirmAction(
      "Confirm cash payment",
      "Have you received the full cash payment from the customer?",
      "Payment Received",
      () => {
        void performCashPaymentReceived();
      },
    );
  }

  async function performCashPaymentReceived() {
    if (!booking) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await confirmProviderCashPaymentReceived(booking.id);

      setSuccessMessage("Cash payment confirmed successfully.");

      await loadBooking(true);
    } catch (error) {
      handleActionError(error, "Unable to confirm the cash payment.");
    } finally {
      setIsProcessing(false);
    }
  }
  const statusClasses = getStatusClasses(booking.status);

  const canAccept =
    booking.status === "pending" && booking.provider_id === null;

  const canTravelling = booking.status === "accepted";

  const canArrived = booking.status === "travelling";

  const canStart = booking.status === "arrived";

  const canComplete = booking.status === "in_progress";
  const canConfirmCashPayment =
    booking.status === "completed" &&
    booking.payment_method === "cash" &&
    booking.payments?.payment_status === "pending";

  const canChat = ["accepted", "travelling", "arrived", "in_progress"].includes(
    booking.status,
  );

  const customer = booking.users_bookings_customer_idTousers;

  const progress = getStatusProgress(booking.status);

  async function callCustomer() {
    if (!customer.phone) {
      return;
    }

    const normalized = customer.phone.replace(/[^\d+]/g, "");

    await Linking.openURL(`tel:${normalized}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setSuccessMessage("");
                void loadBooking(true);
              }}
              tintColor="#159A64"
            />
          }
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
                  className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                  onPress={() => router.replace("/provider/bookings")}
                  disabled={isProcessing}
                >
                  <ArrowLeft size={19} color="#132F57" />
                </Pressable>

                <Pressable
                  className="flex-row items-center rounded-2xl bg-white border border-[#E7ECF2] px-3.5 py-3 active:opacity-70"
                  disabled={isRefreshing || isProcessing}
                  onPress={() => {
                    setSuccessMessage("");
                    void loadBooking(true);
                  }}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#159A64" />
                  ) : (
                    <RefreshCw size={16} color="#159A64" />
                  )}

                  <Text className="ml-2 text-xs font-bold text-[#132F57]">
                    {isRefreshing ? "Refreshing" : "Refresh"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* HERO */}
            <View className="px-5 mt-4">
              <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
                <View
                  className={
                    isTablet ? "flex-row items-start justify-between" : ""
                  }
                >
                  <View className="flex-1">
                    <View className="flex-row items-center self-start bg-white/10 rounded-full px-3 py-1.5">
                      <Sparkles size={14} color="#FFD166" />

                      <Text className="text-white text-[10px] font-extrabold ml-1.5 tracking-wide">
                        JOB #{booking.id}
                      </Text>
                    </View>

                    <Text
                      className={`text-white font-extrabold mt-4 ${
                        isTablet
                          ? "text-[30px] leading-9"
                          : "text-[24px] leading-8"
                      }`}
                    >
                      {booking.services.name}
                    </Text>

                    <Text className="text-white/60 text-xs mt-1.5">
                      {booking.services.service_categories.name}
                    </Text>
                  </View>

                  <View
                    className={`self-start rounded-full border px-3 py-1.5 ${
                      isTablet ? "" : "mt-4"
                    } ${statusClasses.container} ${statusClasses.border}`}
                  >
                    <Text
                      className={`text-[10px] font-extrabold ${statusClasses.text}`}
                    >
                      {formatStatus(booking.status)}
                    </Text>
                  </View>
                </View>

                {booking.status !== "cancelled" && (
                  <View className="mt-5">
                    <View className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <View
                        style={{
                          width: `${progress}%`,
                        }}
                        className="h-full bg-[#5DD39E] rounded-full"
                      />
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-white/55 text-[10px]">
                        Job progress
                      </Text>

                      <Text className="text-white text-[10px] font-bold">
                        {progress}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* MESSAGES */}
            {errorMessage ? (
              <View className="px-5 mt-4">
                <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4 flex-row items-start">
                  <XCircle size={17} color="#BE123C" />

                  <Text className="flex-1 ml-2 text-xs leading-5 font-semibold text-[#BE123C]">
                    {errorMessage}
                  </Text>
                </View>
              </View>
            ) : null}

            {successMessage ? (
              <View className="px-5 mt-4">
                <View className="rounded-[20px] border border-[#CDEBD9] bg-[#EAF8F1] p-4 flex-row items-center">
                  <BadgeCheck size={17} color="#159A64" />

                  <Text className="flex-1 ml-2 text-xs font-semibold text-[#159A64]">
                    {successMessage}
                  </Text>
                </View>
              </View>
            ) : null}

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
                {/* CUSTOMER */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-11 h-11 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                        <UserRound size={19} color="#3563E9" />
                      </View>

                      <View className="ml-3 flex-1">
                        <Text className="text-[#64748B] text-[10px] font-bold">
                          CUSTOMER
                        </Text>

                        <Text className="text-[#132F57] text-base font-extrabold mt-0.5">
                          {customer.full_name}
                        </Text>

                        <Text className="text-[#64748B] text-xs mt-1">
                          {customer.phone ?? "Phone not available"}
                        </Text>
                      </View>
                    </View>

                    {customer.phone ? (
                      <Pressable
                        onPress={() => void callCustomer()}
                        className="w-10 h-10 rounded-xl bg-[#FFF3EE] items-center justify-center active:opacity-70"
                      >
                        <Phone size={17} color="#FF5A3C" />
                      </Pressable>
                    ) : null}
                  </View>

                  {canChat ? (
                    <Pressable
                      className="mt-4 rounded-2xl bg-[#159A64] py-4 flex-row items-center justify-center active:opacity-80"
                      onPress={() =>
                        router.push({
                          pathname: "/provider/chat/[id]",
                          params: {
                            id: String(booking.id),
                          },
                        })
                      }
                      disabled={isProcessing}
                    >
                      <MessageCircle size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-white font-bold text-sm">
                        Chat with customer
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* LOCATION */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                      <MapPin size={18} color="#FF5A3C" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Service location
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Where you need to go
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#FFF8F5] border border-[#FFE4DA] rounded-2xl p-4">
                    <Text className="text-[#64748B] text-[10px]">Area</Text>

                    <Text className="text-[#132F57] text-sm font-bold mt-1">
                      {booking.service_area}
                    </Text>

                    <View className="h-px bg-[#F5D8CC] my-3" />

                    <Text className="text-[#64748B] text-[10px]">
                      Full address
                    </Text>

                    <Text className="text-[#132F57] text-sm leading-6 font-semibold mt-1">
                      {booking.service_address}
                    </Text>

                    {booking.customer_addresses?.landmark ? (
                      <>
                        <View className="h-px bg-[#F5D8CC] my-3" />

                        <Text className="text-[#64748B] text-[10px]">
                          Landmark
                        </Text>

                        <Text className="text-[#132F57] text-sm font-semibold mt-1">
                          {booking.customer_addresses.landmark}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* SCHEDULE */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                      <CalendarDays size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Schedule
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Customer&apos;s preferred appointment
                      </Text>
                    </View>
                  </View>

                  <View className={isTablet ? "flex-row gap-3" : "gap-3"}>
                    <View
                      className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4"
                      style={{ flex: 1 }}
                    >
                      <CalendarDays size={15} color="#64748B" />

                      <Text className="text-[#64748B] text-[10px] mt-2">
                        Preferred date
                      </Text>

                      <Text className="text-[#132F57] text-sm font-bold mt-1">
                        {formatDate(booking.preferred_date)}
                      </Text>
                    </View>

                    <View
                      className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4"
                      style={{ flex: 1 }}
                    >
                      <Clock3 size={15} color="#64748B" />

                      <Text className="text-[#64748B] text-[10px] mt-2">
                        Preferred time
                      </Text>

                      <Text className="text-[#132F57] text-sm font-bold mt-1">
                        {formatTime(booking.preferred_time)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* NOTES */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                  <Text className="text-[#132F57] text-sm font-extrabold">
                    Service notes
                  </Text>

                  <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                    {booking.notes?.trim() ||
                      "No additional notes were provided."}
                  </Text>
                </View>

                {/* STATUS HISTORY */}
                {booking.booking_status_history.length > 0 ? (
                  <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                    <View className="flex-row items-center mb-5">
                      <View className="w-10 h-10 rounded-2xl bg-[#F2F4F7] items-center justify-center">
                        <Clock3 size={18} color="#64748B" />
                      </View>

                      <View className="ml-3">
                        <Text className="text-[#132F57] text-sm font-extrabold">
                          Job timeline
                        </Text>

                        <Text className="text-[#64748B] text-[10px] mt-0.5">
                          Complete status history
                        </Text>
                      </View>
                    </View>

                    {booking.booking_status_history.map((item, index) => {
                      const isLast =
                        index === booking.booking_status_history.length - 1;

                      return (
                        <View
                          key={item.id}
                          className={`flex-row ${isLast ? "" : "mb-4"}`}
                        >
                          <View className="items-center mr-3">
                            <View
                              className={`w-7 h-7 rounded-full items-center justify-center ${
                                isLast ? "bg-[#159A64]" : "bg-[#EEF2F6]"
                              }`}
                            >
                              {isLast ? (
                                <Check size={14} color="#FFFFFF" />
                              ) : (
                                <View className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                              )}
                            </View>

                            {!isLast ? (
                              <View className="w-px flex-1 bg-[#E2E8F0] mt-1" />
                            ) : null}
                          </View>

                          <View className="flex-1">
                            <Text className="text-[#132F57] text-xs font-extrabold">
                              {formatStatus(item.new_status)}
                            </Text>

                            <Text className="text-[#64748B] text-[10px] mt-1">
                              {formatDateTime(item.created_at)}
                            </Text>

                            {item.note ? (
                              <Text className="text-[#64748B] text-xs leading-5 mt-1.5">
                                {item.note}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* RIGHT COLUMN */}
              <View
                style={{
                  width: isDesktop ? 390 : "100%",
                  marginTop: isDesktop ? 0 : 16,
                }}
              >
                {/* PRICE */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                      <Receipt size={18} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Price & payment
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Job financial summary
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#F8FAFC] rounded-2xl p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[#64748B] text-xs">
                        Payment method
                      </Text>

                      <View
                        className={`rounded-full px-2.5 py-1.5 ${
                          booking.payment_method === "cash"
                            ? "bg-[#FFF7E6]"
                            : "bg-[#EEF4FF]"
                        }`}
                      >
                        <View className="flex-row items-center">
                          {booking.payment_method === "cash" ? (
                            <Banknote size={12} color="#B7791F" />
                          ) : (
                            <CreditCard size={12} color="#3563E9" />
                          )}

                          <Text
                            className={`ml-1 text-[9px] font-extrabold ${
                              booking.payment_method === "cash"
                                ? "text-[#B7791F]"
                                : "text-[#3563E9]"
                            }`}
                          >
                            {formatStatus(booking.payment_method)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="h-px bg-[#E7ECF2] my-4" />

                    <View className="flex-row items-center justify-between">
                      <Text className="text-[#64748B] text-xs">
                        Estimated price
                      </Text>

                      <Text className="text-[#132F57] text-sm font-extrabold">
                        {formatMoney(booking.estimated_price)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-[#64748B] text-xs">
                        Final price
                      </Text>

                      <Text className="text-[#159A64] text-base font-extrabold">
                        {booking.final_price !== null &&
                        booking.final_price !== undefined
                          ? formatMoney(booking.final_price)
                          : "Not finalized"}
                      </Text>
                    </View>
                  </View>

                  {booking.payment_method === "cash" ? (
                    <View className="bg-[#FFF7E6] border border-[#FDE7B1] rounded-2xl px-4 py-3 mt-3">
                      <Text className="text-[#92400E] text-[10px] leading-5">
                        Collect the final amount from the customer. Platform
                        commission is settled only after you confirm that the
                        cash payment was received.
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-[#EEF4FF] border border-[#D8E4FF] rounded-2xl px-4 py-3 mt-3">
                      <Text className="text-[#1D4ED8] text-[10px] leading-5">
                        The customer pays online. Your net earnings are credited
                        only after the payment gateway verifies a successful
                        payment.
                      </Text>
                    </View>
                  )}

                  {canComplete ? (
                    <View className="mt-4">
                      <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                        Final job price
                      </Text>

                      <TextInput
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-[#132F57] text-sm"
                        value={finalPrice}
                        onChangeText={(value) => {
                          const sanitized = value.replace(/[^0-9.]/g, "");

                          setFinalPrice(sanitized);
                          setErrorMessage("");
                        }}
                        placeholder="Enter final amount"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        editable={!isProcessing}
                      />
                    </View>
                  ) : null}
                </View>

                {/* PAYMENT RECORD */}
                {booking.payments ? (
                  <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                    <Text className="text-[#132F57] text-sm font-extrabold">
                      Payment record
                    </Text>

                    <View className="bg-[#F8FAFC] rounded-2xl p-4 mt-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[#64748B] text-xs">Amount</Text>

                        <Text className="text-[#132F57] text-sm font-extrabold">
                          {formatMoney(booking.payments.amount)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-[#64748B] text-xs">Method</Text>

                        <Text className="text-[#132F57] text-xs font-bold">
                          {formatStatus(booking.payments.payment_method)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-[#64748B] text-xs">Status</Text>

                        <Text className="text-[#132F57] text-xs font-bold">
                          {formatStatus(booking.payments.payment_status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                {canConfirmCashPayment ? (
                  <View className="mt-4 rounded-2xl border border-[#FDE7B1] bg-[#FFF7E6] p-4">
                    <Text className="text-[#92400E] text-xs font-extrabold">
                      Cash payment awaiting confirmation
                    </Text>

                    <Text className="text-[#92400E] text-[10px] leading-5 mt-1">
                      After you physically receive the cash from the customer,
                      confirm it below.
                    </Text>
                  </View>
                ) : null}

                {/* CANCELLED */}
                {booking.status === "cancelled" ? (
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
                          {booking.cancellation_reason ||
                            "No cancellation reason was provided."}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* ACTIONS */}
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                  <Text className="text-[#132F57] text-sm font-extrabold">
                    Job actions
                  </Text>

                  <Text className="text-[#64748B] text-[10px] mt-1">
                    Available actions depend on the current job status
                  </Text>

                  {canAccept ? (
                    <View className="mt-4">
                      <Pressable
                        className="rounded-2xl bg-[#159A64] py-4 items-center flex-row justify-center active:opacity-80"
                        onPress={handleAccept}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} color="#FFFFFF" />

                            <Text className="ml-2 text-white font-bold text-sm">
                              Accept booking
                            </Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        className="rounded-2xl border border-[#E2E8F0] bg-white py-4 items-center mt-3 active:opacity-70"
                        onPress={handleReject}
                        disabled={isProcessing}
                      >
                        <Text className="font-bold text-[#475569] text-sm">
                          Dismiss request
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {canTravelling ? (
                    <Pressable
                      className="rounded-2xl bg-[#3563E9] py-4 items-center mt-4 flex-row justify-center active:opacity-80"
                      onPress={handleTravelling}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <MapPin size={16} color="#FFFFFF" />

                          <Text className="ml-2 text-white font-bold text-sm">
                            Start travelling
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {canArrived ? (
                    <Pressable
                      className="rounded-2xl bg-[#159A64] py-4 items-center mt-4 flex-row justify-center active:opacity-80"
                      onPress={handleArrived}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <MapPin size={16} color="#FFFFFF" />

                          <Text className="ml-2 text-white font-bold text-sm">
                            Mark arrived
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {canStart ? (
                    <Pressable
                      className="rounded-2xl bg-[#3563E9] py-4 items-center mt-4 flex-row justify-center active:opacity-80"
                      onPress={handleStart}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Sparkles size={16} color="#FFFFFF" />

                          <Text className="ml-2 text-white font-bold text-sm">
                            Start job
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {canComplete ? (
                    <Pressable
                      className="rounded-2xl bg-[#159A64] py-4 items-center mt-4 flex-row justify-center active:opacity-80"
                      onPress={handleCompleteConfirmation}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#FFFFFF" />

                          <Text className="ml-2 text-white font-bold text-sm">
                            Complete job
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                  {canConfirmCashPayment ? (
                    <Pressable
                      className="rounded-2xl bg-[#159A64] py-4 items-center mt-4 flex-row justify-center active:opacity-80"
                      onPress={handleCashPaymentReceivedConfirmation}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Banknote size={16} color="#FFFFFF" />

                          <Text className="ml-2 text-white font-bold text-sm">
                            Payment Received
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {!canAccept &&
                  !canTravelling &&
                  !canArrived &&
                  !canStart &&
                  !canComplete &&
                  !canConfirmCashPayment ? (
                    <View className="bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4 mt-4 flex-row items-center">
                      <ShieldCheck size={17} color="#64748B" />

                      <Text className="flex-1 ml-2 text-[#64748B] text-xs leading-5">
                        No status action is available for this job right now.
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    className="rounded-2xl border border-[#E2E8F0] bg-white py-4 items-center mt-3 flex-row justify-center active:opacity-70"
                    onPress={() => router.replace("/provider/bookings")}
                    disabled={isProcessing}
                  >
                    <Text className="text-[#475569] font-bold text-sm">
                      Return to job list
                    </Text>

                    <ArrowRight
                      size={15}
                      color="#64748B"
                      style={{
                        marginLeft: 6,
                      }}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
