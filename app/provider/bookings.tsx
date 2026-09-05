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
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
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

  return `NPR ${amount.toLocaleString()}`;
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

export default function ProviderBookingsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
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
        setSuccessMessage("Bookings refreshed.");
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
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading provider jobs...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadBookings(true);
            }}
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
                className="flex-row items-center rounded-2xl bg-white border border-[#E7ECF2] px-3.5 py-3 active:opacity-70"
                disabled={isRefreshing}
                onPress={() => {
                  setSuccessMessage("");
                  void loadBookings(true);
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

            <View className="mt-5">
              <Text className="text-[11px] font-extrabold tracking-[1.2px] text-[#159A64]">
                PROVIDER JOBS
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Manage your work
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Review requests, manage active jobs and track completed work.
              </Text>
            </View>
          </View>

          {/* SUMMARY */}
          <View className="px-5 mt-5">
            <View
              className={
                isTablet
                  ? "flex-row gap-3"
                  : "flex-row flex-wrap justify-between"
              }
            >
              {tabs.map((tab) => {
                const Icon = getTabIcon(tab.key);

                const isSelected = selectedTab === tab.key;

                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      setSelectedTab(tab.key);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className={`rounded-[22px] border p-4 mb-3 active:opacity-75 ${
                      isSelected
                        ? "bg-[#132F57] border-[#132F57]"
                        : "bg-white border-[#E7ECF2]"
                    }`}
                    style={{
                      width: isTablet ? undefined : "48.5%",
                      flex: isTablet ? 1 : undefined,
                    }}
                  >
                    <View
                      className={`w-10 h-10 rounded-2xl items-center justify-center ${
                        isSelected ? "bg-white/10" : "bg-[#F5F7FA]"
                      }`}
                    >
                      <Icon
                        size={18}
                        color={
                          isSelected
                            ? "#FFFFFF"
                            : tab.key === "completed"
                              ? "#159A64"
                              : tab.key === "cancelled"
                                ? "#DC2626"
                                : "#3563E9"
                        }
                      />
                    </View>

                    <Text
                      className={`mt-4 text-2xl font-extrabold ${
                        isSelected ? "text-white" : "text-[#132F57]"
                      }`}
                    >
                      {tab.count}
                    </Text>

                    <Text
                      className={`mt-1 text-[11px] font-bold ${
                        isSelected ? "text-white/70" : "text-[#64748B]"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* CURRENT FILTER */}
          <View className="px-5 mt-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
              }}
            >
              {tabs.map((tab) => {
                const selected = selectedTab === tab.key;

                return (
                  <Pressable
                    key={tab.key}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected
                        ? "border-[#159A64] bg-[#159A64]"
                        : "border-[#E2E8F0] bg-white"
                    }`}
                    onPress={() => {
                      setSelectedTab(tab.key);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selected ? "text-white" : "text-[#475569]"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* MESSAGES */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
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

                  <Text className="ml-2 text-xs font-bold text-[#BE123C]">
                    Try again
                  </Text>
                </Pressable>
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

                <Pressable
                  onPress={() => setSuccessMessage("")}
                  className="w-8 h-8 rounded-xl bg-white items-center justify-center"
                >
                  <X size={14} color="#159A64" />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* CONTENT HEADER */}
          <View className="px-5 mt-7">
            <Text className="text-[#132F57] text-xl font-extrabold">
              {selectedTab === "available"
                ? "Available requests"
                : selectedTab === "active"
                  ? "Active jobs"
                  : selectedTab === "completed"
                    ? "Completed jobs"
                    : "Cancelled jobs"}
            </Text>

            <Text className="text-[#64748B] text-xs mt-1">
              {displayedBookings.length}{" "}
              {displayedBookings.length === 1 ? "job" : "jobs"} in this section
            </Text>
          </View>

          {/* EMPTY */}
          {displayedBookings.length === 0 ? (
            <View className="px-5 mt-4">
              <View className="items-center rounded-[28px] border border-[#E7ECF2] bg-white px-6 py-12">
                <View className="w-20 h-20 rounded-[26px] bg-[#F5F7FA] items-center justify-center">
                  <BriefcaseBusiness size={30} color="#94A3B8" />
                </View>

                <Text className="mt-5 text-lg font-extrabold text-[#132F57]">
                  No bookings found
                </Text>

                <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[290px]">
                  {selectedTab === "available"
                    ? "No matching service requests are currently available."
                    : `You have no ${selectedTab} jobs.`}
                </Text>
              </View>
            </View>
          ) : (
            <View
              className={
                isDesktop ? "flex-row flex-wrap px-5 mt-4 gap-4" : "px-5 mt-4"
              }
            >
              {displayedBookings.map((booking) => {
                const statusStyle = getStatusClasses(booking.status);

                const isProcessing = processingBookingId === booking.id;

                return (
                  <Pressable
                    key={booking.id}
                    className="rounded-[26px] border border-[#E7ECF2] bg-white mb-4 overflow-hidden active:opacity-80"
                    style={{
                      width: isDesktop ? "48.9%" : "100%",
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
                    {/* CARD HEADER */}
                    <View className="p-5">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-[10px] font-extrabold tracking-wide text-[#94A3B8]">
                            JOB #{booking.id}
                          </Text>

                          <Text className="mt-1 text-lg font-extrabold text-[#132F57]">
                            {booking.services.name}
                          </Text>

                          <View className="flex-row items-center mt-2">
                            <UserRound size={14} color="#64748B" />

                            <Text className="ml-1.5 text-xs font-semibold text-[#64748B]">
                              {
                                booking.users_bookings_customer_idTousers
                                  .full_name
                              }
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`rounded-full border px-2.5 py-1 ${statusStyle.container} ${statusStyle.border}`}
                        >
                          <Text
                            className={`text-[9px] font-extrabold ${statusStyle.text}`}
                          >
                            {formatStatus(booking.status)}
                          </Text>
                        </View>
                      </View>

                      {/* JOB INFO */}
                      <View className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                        <View className="flex-row items-start">
                          <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
                            <MapPin size={16} color="#FF5A3C" />
                          </View>

                          <View className="flex-1 ml-3">
                            <Text className="text-xs font-bold text-[#132F57]">
                              {booking.service_area}
                            </Text>

                            <Text className="mt-1 text-[11px] leading-5 text-[#64748B]">
                              {booking.service_address}
                            </Text>
                          </View>
                        </View>

                        <View className="h-px bg-[#E7ECF2] my-3" />

                        <View className="flex-row items-center">
                          <CalendarDays size={14} color="#64748B" />

                          <Text className="ml-2 text-[11px] text-[#64748B]">
                            Preferred: {formatDate(booking.preferred_date)}
                          </Text>
                        </View>
                      </View>

                      {/* PAYMENT / PRICE */}
                      <View className="mt-4 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[10px] text-[#94A3B8]">
                            Service value
                          </Text>

                          <Text className="mt-0.5 text-lg font-extrabold text-[#159A64]">
                            {formatMoney(
                              booking.final_price ?? booking.estimated_price,
                            )}
                          </Text>
                        </View>

                        <View
                          className={`rounded-full px-2.5 py-1.5 ${
                            booking.payment_method === "cash"
                              ? "bg-[#FFF7E6]"
                              : "bg-[#EEF4FF]"
                          }`}
                        >
                          <View className="flex-row items-center">
                            <CreditCard
                              size={12}
                              color={
                                booking.payment_method === "cash"
                                  ? "#B7791F"
                                  : "#3563E9"
                              }
                            />

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

                      {/* VIEW DETAILS */}
                      <View className="mt-4 pt-4 border-t border-[#EEF2F6] flex-row items-center justify-between">
                        <Text className="text-[10px] text-[#64748B]">
                          Tap to open full job details
                        </Text>

                        <View className="flex-row items-center">
                          <Text className="text-xs font-bold text-[#159A64]">
                            View details
                          </Text>

                          <ArrowRight
                            size={14}
                            color="#159A64"
                            style={{
                              marginLeft: 5,
                            }}
                          />
                        </View>
                      </View>

                      {/* AVAILABLE ACTIONS */}
                      {selectedTab === "available" ? (
                        <View className="mt-5 flex-row gap-3">
                          <Pressable
                            className="flex-1 items-center justify-center rounded-2xl bg-[#159A64] py-4 active:opacity-80"
                            onPress={(event) => {
                              event.stopPropagation();

                              void handleAccept(booking.id);
                            }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator color="#FFFFFF" />
                            ) : (
                              <View className="flex-row items-center">
                                <CheckCircle2 size={16} color="#FFFFFF" />

                                <Text className="ml-2 font-bold text-white text-sm">
                                  Accept
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
                            <Text className="font-bold text-[#475569] text-sm">
                              Dismiss
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
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
