import axios from "axios";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
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
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  RefreshCw,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react-native";

import {
  acceptProviderBooking,
  getAssignedProviderBookings,
  getAvailableProviderBookings,
  rejectProviderBooking,
} from "@/api/provider-bookings";

import type { ProviderBooking } from "@/types";

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

type BookingTab = "available" | "active" | "completed" | "cancelled";

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

function formatDate(value: string) {
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

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
      return {
        container: "bg-[#EEF4FF]",
        text: "text-[#3563E9]",
        border: "border-[#D8E4FF]",
      };

    case "travelling":
      return {
        container: "bg-[#EFF6FF]",
        text: "text-[#2563EB]",
        border: "border-[#DBEAFE]",
      };

    case "arrived":
      return {
        container: "bg-[#ECFDF5]",
        text: "text-[#047857]",
        border: "border-[#D1FAE5]",
      };

    case "accepted":
      return {
        container: "bg-[#F3F0FF]",
        text: "text-[#6D44C5]",
        border: "border-[#E5DDFC]",
      };

    case "assigned":
      return {
        container: "bg-[#FFF7E6]",
        text: "text-[#B7791F]",
        border: "border-[#FDE7B1]",
      };

    case "cancelled":
      return {
        container: "bg-[#FFF1F2]",
        text: "text-[#DC2626]",
        border: "border-[#FECDD3]",
      };

    default:
      return {
        container: "bg-[#F8FAFC]",
        text: "text-[#64748B]",
        border: "border-[#E2E8F0]",
      };
  }
}

function getTabIcon(tab: BookingTab) {
  if (tab === "available") {
    return Sparkles;
  }

  if (tab === "active") {
    return BriefcaseBusiness;
  }

  if (tab === "completed") {
    return CheckCircle2;
  }

  return XCircle;
}

function getTabAccent(tab: BookingTab) {
  if (tab === "available") {
    return "#3563E9";
  }

  if (tab === "active") {
    return "#7C3AED";
  }

  if (tab === "completed") {
    return "#159A64";
  }

  return "#DC2626";
}

export default function ProviderBookingsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 700;

  const [selectedTab, setSelectedTab] = useState<BookingTab>("available");

  const [availableBookings, setAvailableBookings] = useState<ProviderBooking[]>(
    [],
  );

  const [assignedBookings, setAssignedBookings] = useState<ProviderBooking[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [processingBookingId, setProcessingBookingId] = useState<number | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const loadBookings = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const [available, assigned] = await Promise.all([
        getAvailableProviderBookings(),
        getAssignedProviderBookings(),
      ]);

      setAvailableBookings(available);
      setAssignedBookings(assigned);

      if (refresh) {
        setSuccessMessage("Bookings refreshed successfully.");
      }
    } catch (error) {
      console.error("Load provider bookings error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to load provider bookings.",
        );
      } else {
        setErrorMessage("Unable to load provider bookings.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const displayedBookings = useMemo(() => {
    if (selectedTab === "available") {
      return availableBookings;
    }

    if (selectedTab === "active") {
      return assignedBookings.filter((booking) =>
        [
          "assigned",
          "accepted",
          "travelling",
          "arrived",
          "in_progress",
        ].includes(booking.status),
      );
    }

    if (selectedTab === "completed") {
      return assignedBookings.filter(
        (booking) => booking.status === "completed",
      );
    }

    return assignedBookings.filter((booking) => booking.status === "cancelled");
  }, [selectedTab, availableBookings, assignedBookings]);

  async function handleAccept(bookingId: number) {
    if (processingBookingId) {
      return;
    }

    try {
      setProcessingBookingId(bookingId);

      setErrorMessage("");
      setSuccessMessage("");

      await acceptProviderBooking(bookingId);

      setSuccessMessage("Booking accepted successfully.");

      await loadBookings(true);

      setSelectedTab("active");
    } catch (error) {
      console.error("Accept provider booking error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to accept the booking.",
        );
      } else {
        setErrorMessage("Unable to accept the booking.");
      }
    } finally {
      setProcessingBookingId(null);
    }
  }

  async function handleReject(bookingId: number) {
    if (processingBookingId) {
      return;
    }

    try {
      setProcessingBookingId(bookingId);

      setErrorMessage("");
      setSuccessMessage("");

      await rejectProviderBooking(bookingId);

      setAvailableBookings((current) =>
        current.filter((booking) => booking.id !== bookingId),
      );

      setSuccessMessage("Booking dismissed successfully.");
    } catch (error) {
      console.error("Reject provider booking error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to dismiss the booking.",
        );
      } else {
        setErrorMessage("Unable to dismiss the booking.");
      }
    } finally {
      setProcessingBookingId(null);
    }
  }

  const activeCount = assignedBookings.filter((booking) =>
    ["assigned", "accepted", "travelling", "arrived", "in_progress"].includes(
      booking.status,
    ),
  ).length;

  const completedCount = assignedBookings.filter(
    (booking) => booking.status === "completed",
  ).length;

  const cancelledCount = assignedBookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;

  const tabs: {
    key: BookingTab;
    label: string;
    count: number;
  }[] = [
    {
      key: "available",
      label: "Available",
      count: availableBookings.length,
    },
    {
      key: "active",
      label: "Active",
      count: activeCount,
    },
    {
      key: "completed",
      label: "Completed",
      count: completedCount,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: cancelledCount,
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F9FC] items-center justify-center">
        <View className="w-[74px] h-[74px] rounded-[26px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-4 text-[#132F57] text-sm font-extrabold">
          Loading jobs
        </Text>

        <Text className="mt-1 text-[#94A3B8] text-xs">
          Checking available and active work...
        </Text>
      </SafeAreaView>
    );
  }

  const currentTab = tabs.find((tab) => tab.key === selectedTab) ?? tabs[0];

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setSuccessMessage("");
              void loadBookings(true);
            }}
            tintColor="#159A64"
          />
        }
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >
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
              <Pressable
                className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                onPress={() => router.replace("/provider")}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                className="h-11 px-4 rounded-2xl bg-white border border-[#E7ECF2] flex-row items-center justify-center active:opacity-70"
                disabled={isRefreshing}
                onPress={() => {
                  setSuccessMessage("");
                  void loadBookings(true);
                }}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#159A64" />
                ) : (
                  <RefreshCw size={15} color="#159A64" />
                )}

                <Text className="ml-2 text-xs font-extrabold text-[#132F57]">
                  {isRefreshing ? "Refreshing" : "Refresh"}
                </Text>
              </Pressable>
            </View>

            <View className="mt-6">
              <Text className="text-[10px] font-extrabold tracking-[1.7px] text-[#159A64]">
                PROVIDER JOBS
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[32px]" : "text-[27px]"
                }`}
              >
                Manage your bookings
              </Text>

              <Text className="mt-2 text-sm leading-5 text-[#64748B] max-w-[630px]">
                Discover available service requests, manage active jobs and
                review your completed work.
              </Text>
            </View>
          </View>

          {/* HERO SUMMARY */}
          <View className="px-5 mt-6">
            <View className="rounded-[30px] bg-[#102A4C] overflow-hidden p-5">
              <View
                className={
                  isTablet ? "flex-row items-center justify-between" : ""
                }
              >
                <View className="flex-1">
                  <View className="self-start rounded-full bg-white/10 px-3 py-1.5 flex-row items-center">
                    <BriefcaseBusiness size={14} color="#6EE7B7" />

                    <Text className="ml-2 text-[10px] font-extrabold tracking-wide text-white">
                      WORK OVERVIEW
                    </Text>
                  </View>

                  <Text className="mt-4 text-white/60 text-xs font-semibold">
                    Current work status
                  </Text>

                  <Text className="mt-1 text-white text-[28px] font-extrabold">
                    {activeCount}{" "}
                    {activeCount === 1 ? "active job" : "active jobs"}
                  </Text>

                  <Text className="mt-2 text-white/55 text-[10px] leading-5 max-w-[440px]">
                    Keep your active jobs updated from accepted through
                    travelling, arrived and completion.
                  </Text>
                </View>

                <View className={isTablet ? "w-[340px] ml-6" : "mt-5"}>
                  <View className="rounded-[22px] bg-white/10 border border-white/10 p-4">
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-white/55 text-[9px] font-bold">
                          AVAILABLE
                        </Text>

                        <Text className="mt-1 text-white text-xl font-extrabold">
                          {availableBookings.length}
                        </Text>
                      </View>

                      <View>
                        <Text className="text-white/55 text-[9px] font-bold">
                          COMPLETED
                        </Text>

                        <Text className="mt-1 text-[#6EE7B7] text-xl font-extrabold">
                          {completedCount}
                        </Text>
                      </View>

                      <View>
                        <Text className="text-white/55 text-[9px] font-bold">
                          CANCELLED
                        </Text>

                        <Text className="mt-1 text-[#FDA4AF] text-xl font-extrabold">
                          {cancelledCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* MAIN TAB CARDS */}
          <View className="px-5 mt-6">
            <Text className="text-[#132F57] text-lg font-extrabold">
              Job categories
            </Text>

            <Text className="mt-1 text-[#94A3B8] text-[10px]">
              Choose a category to manage your work
            </Text>

            <View
              className={
                isTablet
                  ? "flex-row mt-4"
                  : "flex-row flex-wrap justify-between mt-4"
              }
            >
              {tabs.map((tab, index) => {
                const Icon = getTabIcon(tab.key);

                const isSelected = selectedTab === tab.key;

                const accent = getTabAccent(tab.key);

                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      setSelectedTab(tab.key);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className={`rounded-[22px] border p-4 mb-3 active:opacity-80 ${
                      isSelected
                        ? "bg-[#132F57] border-[#132F57]"
                        : "bg-white border-[#E7ECF2]"
                    }`}
                    style={{
                      width: isTablet ? undefined : "48.5%",
                      flex: isTablet ? 1 : undefined,
                      marginRight: isTablet && index < tabs.length - 1 ? 12 : 0,
                    }}
                  >
                    <View
                      className={`w-10 h-10 rounded-2xl items-center justify-center ${
                        isSelected ? "bg-white/10" : "bg-[#F5F7FA]"
                      }`}
                    >
                      <Icon size={18} color={isSelected ? "#FFFFFF" : accent} />
                    </View>

                    <Text
                      className={`mt-4 text-2xl font-extrabold ${
                        isSelected ? "text-white" : "text-[#132F57]"
                      }`}
                    >
                      {tab.count}
                    </Text>

                    <Text
                      className={`mt-1 text-[10px] font-bold ${
                        isSelected ? "text-white/65" : "text-[#64748B]"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* QUICK FILTER */}
          <View className="px-5 mt-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingRight: 5,
              }}
            >
              {tabs.map((tab, index) => {
                const selected = selectedTab === tab.key;

                return (
                  <Pressable
                    key={tab.key}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected
                        ? "border-[#159A64] bg-[#159A64]"
                        : "border-[#E2E8F0] bg-white"
                    }`}
                    style={{
                      marginRight: index === tabs.length - 1 ? 0 : 8,
                    }}
                    onPress={() => {
                      setSelectedTab(tab.key);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                  >
                    <Text
                      className={`text-[11px] font-extrabold ${
                        selected ? "text-white" : "text-[#475569]"
                      }`}
                    >
                      {tab.label} {tab.count}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ERROR MESSAGE */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[22px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                <View className="flex-row items-start">
                  <XCircle size={17} color="#BE123C" />

                  <Text className="flex-1 ml-2 text-xs leading-5 font-semibold text-[#BE123C]">
                    {errorMessage}
                  </Text>
                </View>

                <Pressable
                  className="mt-3 self-start rounded-xl border border-[#FECDD3] bg-white px-4 py-2.5 flex-row items-center active:opacity-70"
                  onPress={() => {
                    void loadBookings(true);
                  }}
                >
                  <RefreshCw size={14} color="#BE123C" />

                  <Text className="ml-2 text-xs font-extrabold text-[#BE123C]">
                    Try again
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* SUCCESS MESSAGE */}
          {successMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[22px] border border-[#CDEBD9] bg-[#EAF8F1] p-4 flex-row items-center">
                <BadgeCheck size={17} color="#159A64" />

                <Text className="flex-1 ml-2 text-xs font-semibold text-[#159A64]">
                  {successMessage}
                </Text>

                <Pressable
                  onPress={() => setSuccessMessage("")}
                  className="w-8 h-8 rounded-xl bg-white items-center justify-center"
                >
                  <X size={14} color="#159A64" />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* SECTION HEADER */}
          <View className="px-5 mt-7">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[#132F57] text-xl font-extrabold">
                  {selectedTab === "available"
                    ? "Available requests"
                    : selectedTab === "active"
                      ? "Active jobs"
                      : selectedTab === "completed"
                        ? "Completed jobs"
                        : "Cancelled jobs"}
                </Text>

                <Text className="mt-1 text-[#64748B] text-xs">
                  {displayedBookings.length}{" "}
                  {displayedBookings.length === 1 ? "job" : "jobs"}
                </Text>
              </View>

              <View className="rounded-full bg-[#EEF4FF] px-3 py-1.5">
                <Text className="text-[#3563E9] text-[10px] font-extrabold">
                  {currentTab.label}
                </Text>
              </View>
            </View>
          </View>

          {/* EMPTY STATE */}
          {displayedBookings.length === 0 ? (
            <View className="px-5 mt-4">
              <View className="items-center rounded-[28px] border border-[#E7ECF2] bg-white px-6 py-14">
                <View className="w-[72px] h-[72px] rounded-[26px] bg-[#F5F7FA] items-center justify-center">
                  {selectedTab === "available" ? (
                    <Sparkles size={28} color="#94A3B8" />
                  ) : selectedTab === "completed" ? (
                    <CheckCircle2 size={28} color="#94A3B8" />
                  ) : selectedTab === "cancelled" ? (
                    <XCircle size={28} color="#94A3B8" />
                  ) : (
                    <BriefcaseBusiness size={28} color="#94A3B8" />
                  )}
                </View>

                <Text className="mt-5 text-lg font-extrabold text-[#132F57]">
                  {selectedTab === "available"
                    ? "No requests available"
                    : selectedTab === "active"
                      ? "No active jobs"
                      : selectedTab === "completed"
                        ? "No completed jobs"
                        : "No cancelled jobs"}
                </Text>

                <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[320px]">
                  {selectedTab === "available"
                    ? "New service requests that match your profile will appear here."
                    : selectedTab === "active"
                      ? "Jobs you accept or receive will appear here while they are active."
                      : selectedTab === "completed"
                        ? "Finished service jobs will appear here."
                        : "Cancelled jobs will appear here for your records."}
                </Text>

                <Pressable
                  className="mt-5 flex-row items-center rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 active:opacity-70"
                  onPress={() => {
                    void loadBookings(true);
                  }}
                >
                  <RefreshCw size={14} color="#64748B" />

                  <Text className="ml-2 text-xs font-bold text-[#475569]">
                    Refresh jobs
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View
              className={
                isDesktop ? "flex-row flex-wrap px-5 mt-4" : "px-5 mt-4"
              }
            >
              {displayedBookings.map((booking, index) => {
                const statusStyle = getStatusClasses(booking.status);

                const isProcessing = processingBookingId === booking.id;

                const servicePrice =
                  booking.final_price ?? booking.estimated_price;

                return (
                  <Pressable
                    key={booking.id}
                    className="rounded-[26px] border border-[#E7ECF2] bg-white mb-4 overflow-hidden active:opacity-80"
                    style={{
                      width: isDesktop ? "49%" : "100%",
                      marginRight: isDesktop && index % 2 === 0 ? "2%" : 0,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/provider/booking/[id]",
                        params: {
                          id: String(booking.id),
                        },
                      })
                    }
                    disabled={isProcessing}
                  >
                    {/* TOP ACCENT */}
                    <View
                      className={`h-1 ${
                        booking.status === "completed"
                          ? "bg-[#159A64]"
                          : booking.status === "cancelled"
                            ? "bg-[#DC2626]"
                            : booking.status === "in_progress"
                              ? "bg-[#3563E9]"
                              : "bg-[#132F57]"
                      }`}
                    />

                    <View className="p-5">
                      {/* TITLE */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center">
                            <Text className="text-[9px] font-extrabold tracking-[1px] text-[#94A3B8]">
                              JOB #{booking.id}
                            </Text>
                          </View>

                          <Text className="mt-1 text-[17px] font-extrabold text-[#132F57]">
                            {booking.services.name}
                          </Text>

                          <View className="flex-row items-center mt-2">
                            <View className="w-7 h-7 rounded-xl bg-[#F5F7FA] items-center justify-center">
                              <UserRound size={13} color="#64748B" />
                            </View>

                            <Text
                              numberOfLines={1}
                              className="ml-2 text-xs font-semibold text-[#64748B] flex-1"
                            >
                              {
                                booking.users_bookings_customer_idTousers
                                  .full_name
                              }
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`rounded-full border px-2.5 py-1.5 ${statusStyle.container} ${statusStyle.border}`}
                        >
                          <Text
                            className={`text-[9px] font-extrabold ${statusStyle.text}`}
                          >
                            {formatStatus(booking.status)}
                          </Text>
                        </View>
                      </View>

                      {/* LOCATION */}
                      <View className="mt-5 rounded-[20px] bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                        <View className="flex-row items-start">
                          <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
                            <MapPin size={16} color="#FF5A3C" />
                          </View>

                          <View className="ml-3 flex-1">
                            <Text className="text-[10px] text-[#94A3B8] font-bold">
                              SERVICE LOCATION
                            </Text>

                            <Text className="mt-1 text-xs font-extrabold text-[#132F57]">
                              {booking.service_area}
                            </Text>

                            <Text
                              numberOfLines={2}
                              className="mt-1 text-[10px] leading-4 text-[#64748B]"
                            >
                              {booking.service_address}
                            </Text>
                          </View>
                        </View>

                        <View className="h-px bg-[#E7ECF2] my-3" />

                        <View className="flex-row items-center">
                          <CalendarDays size={14} color="#64748B" />

                          <Text className="ml-2 text-[10px] text-[#64748B]">
                            Preferred date
                          </Text>

                          <Text className="ml-auto text-[10px] font-extrabold text-[#132F57]">
                            {formatDate(booking.preferred_date)}
                          </Text>
                        </View>
                      </View>

                      {/* PRICE + PAYMENT */}
                      <View className="mt-4 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[9px] font-bold text-[#94A3B8]">
                            SERVICE VALUE
                          </Text>

                          <View className="mt-1 flex-row items-center">
                            <Banknote size={16} color="#159A64" />

                            <Text className="ml-1.5 text-lg font-extrabold text-[#159A64]">
                              {formatMoney(servicePrice)}
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`rounded-2xl px-3 py-2 ${
                            booking.payment_method === "cash"
                              ? "bg-[#FFF7E6]"
                              : "bg-[#EEF4FF]"
                          }`}
                        >
                          <View className="flex-row items-center">
                            <CreditCard
                              size={13}
                              color={
                                booking.payment_method === "cash"
                                  ? "#B7791F"
                                  : "#3563E9"
                              }
                            />

                            <Text
                              className={`ml-1.5 text-[9px] font-extrabold ${
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

                      {/* VIEW DETAILS */}
                      <View className="mt-4 pt-4 border-t border-[#EEF2F6] flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Clock3 size={12} color="#94A3B8" />

                          <Text className="ml-1.5 text-[9px] text-[#94A3B8]">
                            Open for full details
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Text className="text-[11px] font-extrabold text-[#159A64]">
                            View job
                          </Text>

                          <ChevronRight
                            size={15}
                            color="#159A64"
                            style={{
                              marginLeft: 3,
                            }}
                          />
                        </View>
                      </View>

                      {/* AVAILABLE ACTIONS */}
                      {selectedTab === "available" ? (
                        <View className="mt-5 flex-row">
                          <Pressable
                            className="flex-1 items-center justify-center rounded-2xl bg-[#159A64] py-4 active:opacity-80"
                            style={{
                              marginRight: 10,
                            }}
                            onPress={(event) => {
                              event.stopPropagation();

                              void handleAccept(booking.id);
                            }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <View className="flex-row items-center">
                                <CheckCircle2 size={16} color="#FFFFFF" />

                                <Text className="ml-2 font-extrabold text-white text-xs">
                                  Accept job
                                </Text>
                              </View>
                            )}
                          </Pressable>

                          <Pressable
                            className="flex-1 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-4 active:opacity-70"
                            onPress={(event) => {
                              event.stopPropagation();

                              void handleReject(booking.id);
                            }}
                            disabled={isProcessing}
                          >
                            <View className="flex-row items-center">
                              <XCircle size={15} color="#64748B" />

                              <Text className="ml-2 font-extrabold text-[#475569] text-xs">
                                Dismiss
                              </Text>
                            </View>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-3.5 flex-row items-center justify-between active:opacity-70"
                          onPress={(event) => {
                            event.stopPropagation();

                            router.push({
                              pathname: "/provider/booking/[id]",
                              params: {
                                id: String(booking.id),
                              },
                            });
                          }}
                        >
                          <Text className="text-[#132F57] text-xs font-bold">
                            Manage job
                          </Text>

                          <ArrowRight size={15} color="#159A64" />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
