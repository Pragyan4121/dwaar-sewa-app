import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
  Wifi,
  WifiOff,
} from "lucide-react-native";

import {
  getProviderDashboard,
  updateProviderAvailability,
} from "@/api/provider-dashboard";

import { getMyNotifications } from "@/api/notifications";

import { useProviderAuth } from "@/context/ProviderAuthContext";

import type { ProviderDashboardResponse } from "@/types";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  verification_status?: string;
}

function formatMoney(value: string | number | null) {
  if (value === null || value === undefined) {
    return "NPR 0";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `NPR ${value}`;
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

function getStatusStyle(status: string) {
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

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProviderDashboardScreen() {
  const {
    provider,
    isProviderLoading,
    isProviderAuthenticated,
    logoutProvider,
    refreshProvider,
  } = useProviderAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [dashboard, setDashboard] = useState<ProviderDashboardResponse | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [availabilityMessage, setAvailabilityMessage] = useState("");

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const loadUnreadNotificationCount = useCallback(async () => {
    if (!isProviderAuthenticated) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const result = await getMyNotifications({
        page: 1,
        limit: 1,
        unreadOnly: false,
      });

      setUnreadNotificationCount(result.unread_count);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [isProviderAuthenticated]);

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const result = await getProviderDashboard();

      setDashboard(result);
    } catch (error) {
      console.error("Load provider dashboard error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ??
            "Unable to load the provider dashboard.",
        );
      } else {
        setErrorMessage("Unable to load the provider dashboard.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isProviderAuthenticated && provider) {
      void loadDashboard();
    }
  }, [isProviderAuthenticated, provider, loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void loadUnreadNotificationCount();
    }, [loadUnreadNotificationCount]),
  );

  async function handleAvailabilityChange(value: boolean) {
    if (isUpdatingAvailability || !dashboard) {
      return;
    }

    try {
      setIsUpdatingAvailability(true);
      setAvailabilityMessage("");
      setErrorMessage("");

      const result = await updateProviderAvailability(value);

      const updatedAvailability =
        result.availability?.is_available ?? result.is_available ?? value;

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          provider: {
            ...current.provider,
            is_available: updatedAvailability,
          },
        };
      });

      setAvailabilityMessage(result.message);

      await refreshProvider();
    } catch (error) {
      console.error("Update provider availability error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to update availability.",
        );
      } else {
        setErrorMessage("Unable to update availability.");
      }
    } finally {
      setIsUpdatingAvailability(false);
    }
  }

  async function handleLogout() {
    await logoutProvider();
    router.replace("/provider/login");
  }

  if (isProviderLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Restoring provider session...
        </Text>
      </SafeAreaView>
    );
  }

  if (!isProviderAuthenticated || !provider) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <View className="w-full max-w-[460px] rounded-[28px] border border-[#E7ECF2] bg-white p-7 items-center">
          <View className="w-16 h-16 rounded-[22px] bg-[#EAF8F1] items-center justify-center">
            <UserRound size={28} color="#159A64" />
          </View>

          <Text className="mt-5 text-center text-xl font-extrabold text-[#132F57]">
            Provider login required
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-[#64748B]">
            Sign in to manage jobs, availability, profile and earnings.
          </Text>

          <Pressable
            className="mt-6 w-full rounded-2xl bg-[#159A64] py-4 items-center active:opacity-80"
            onPress={() => router.replace("/provider/login")}
          >
            <Text className="font-bold text-white">Go to Provider Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !dashboard) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading provider dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const verificationStatus =
    dashboard?.provider.verification_status ??
    provider.profile?.verification_status ??
    "pending";

  const isApproved = verificationStatus === "approved";

  const isAvailable =
    dashboard?.provider.is_available ?? provider.profile?.is_available ?? false;

  const firstName =
    provider.full_name?.trim().split(" ")[0] ?? provider.full_name;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboard(true)}
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
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[11px] font-extrabold tracking-[1.2px] text-[#159A64]">
                  PROVIDER DASHBOARD
                </Text>

                <Text
                  className={`mt-1 font-extrabold text-[#132F57] ${
                    isTablet ? "text-[30px]" : "text-[26px]"
                  }`}
                >
                  Good to see you, {firstName}
                </Text>

                <Text className="mt-1 text-sm text-[#64748B]">
                  Manage jobs, availability and your daily activity.
                </Text>
              </View>

              <View className="flex-row items-center">
                <Pressable
                  onPress={() => router.push("/notifications")}
                  className="relative w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                >
                  <Bell size={19} color="#132F57" />

                  {unreadNotificationCount > 0 ? (
                    <View className="absolute -right-1 -top-1 min-w-[20px] h-5 px-1 items-center justify-center rounded-full bg-[#FF5A3C] border-2 border-[#F8FAFC]">
                      <Text className="text-[9px] font-extrabold text-white">
                        {unreadNotificationCount > 99
                          ? "99+"
                          : unreadNotificationCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  onPress={() => router.push("/provider/profile")}
                  className="ml-2 w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                >
                  <UserRound size={19} color="#132F57" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* HERO / AVAILABILITY */}
          <View className="px-5 mt-5">
            <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
              <View className={isTablet ? "flex-row items-center" : ""}>
                <View className={isTablet ? "flex-1 pr-5" : ""}>
                  <View className="flex-row items-center self-start bg-white/10 rounded-full px-3 py-1.5">
                    {isAvailable ? (
                      <Wifi size={14} color="#5DD39E" />
                    ) : (
                      <WifiOff size={14} color="#F8B4B4" />
                    )}

                    <Text className="text-white text-[10px] font-extrabold ml-1.5 tracking-wide">
                      {isAvailable ? "YOU'RE ONLINE" : "YOU'RE OFFLINE"}
                    </Text>
                  </View>

                  <Text className="text-white text-xl font-extrabold mt-4">
                    Availability
                  </Text>

                  <Text className="text-white/65 text-xs leading-5 mt-1 max-w-[470px]">
                    {isAvailable
                      ? "You can receive new service requests while you're online."
                      : "Go online when you're ready to receive new service requests."}
                  </Text>
                </View>

                <View className={isTablet ? "w-[250px]" : "mt-5"}>
                  <View className="bg-white rounded-[20px] px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Accept new jobs
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-1">
                        {isApproved
                          ? "Toggle your work status"
                          : "Approval required"}
                      </Text>
                    </View>

                    {isUpdatingAvailability ? (
                      <ActivityIndicator size="small" color="#159A64" />
                    ) : (
                      <Switch
                        value={isAvailable}
                        onValueChange={handleAvailabilityChange}
                        disabled={!isApproved}
                        trackColor={{
                          false: "#CBD5E1",
                          true: "#86D9B2",
                        }}
                        thumbColor={isAvailable ? "#159A64" : "#FFFFFF"}
                      />
                    )}
                  </View>
                </View>
              </View>

              {!isApproved && (
                <View className="mt-4 rounded-2xl bg-[#FFF7E6] border border-[#FDE7B1] p-3.5">
                  <View className="flex-row items-start">
                    <BadgeCheck size={16} color="#B7791F" />

                    <Text className="flex-1 ml-2 text-xs leading-5 text-[#92400E]">
                      Your provider profile must be approved before you can go
                      online. Current status: {formatStatus(verificationStatus)}
                      .
                    </Text>
                  </View>
                </View>
              )}

              {availabilityMessage ? (
                <View className="mt-4 rounded-2xl bg-[#EAF8F1] px-4 py-3">
                  <Text className="text-xs font-bold text-[#159A64]">
                    {availabilityMessage}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-4">
                <Text className="text-xs leading-5 font-semibold text-[#BE123C]">
                  {errorMessage}
                </Text>

                <Pressable
                  className="mt-3 self-start rounded-xl bg-white border border-[#FECDD3] px-4 py-2.5 flex-row items-center active:opacity-70"
                  onPress={() => loadDashboard()}
                >
                  <RefreshCw size={14} color="#BE123C" />

                  <Text className="ml-2 text-xs font-bold text-[#BE123C]">
                    Try again
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* STATS */}
          <View className="px-5 mt-5">
            <Text className="text-[#132F57] text-xl font-extrabold">
              Today at a glance
            </Text>

            <Text className="text-[#64748B] text-xs mt-1">
              Your current provider activity
            </Text>

            <View
              className={
                isTablet
                  ? "flex-row gap-3 mt-4"
                  : "flex-row flex-wrap justify-between mt-4"
              }
            >
              <Pressable
                onPress={() => router.push("/provider/bookings")}
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3 active:opacity-75"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                  <Sparkles size={18} color="#FF5A3C" />
                </View>

                <Text className="text-[#132F57] text-2xl font-extrabold mt-4">
                  {dashboard?.statistics.available_requests ?? 0}
                </Text>

                <Text className="text-[#64748B] text-[11px] mt-1">
                  Available requests
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/provider/bookings")}
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3 active:opacity-75"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                  <BriefcaseBusiness size={18} color="#3563E9" />
                </View>

                <Text className="text-[#132F57] text-2xl font-extrabold mt-4">
                  {dashboard?.statistics.active_jobs ?? 0}
                </Text>

                <Text className="text-[#64748B] text-[11px] mt-1">
                  Active jobs
                </Text>
              </Pressable>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                  <CheckCircle2 size={18} color="#159A64" />
                </View>

                <Text className="text-[#132F57] text-2xl font-extrabold mt-4">
                  {dashboard?.statistics.completed_jobs ?? 0}
                </Text>

                <Text className="text-[#64748B] text-[11px] mt-1">
                  Completed jobs
                </Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#FFF7E6] items-center justify-center">
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                </View>

                <Text className="text-[#132F57] text-2xl font-extrabold mt-4">
                  {dashboard?.provider.average_rating ?? 0}
                </Text>

                <Text className="text-[#64748B] text-[11px] mt-1">
                  Average rating
                </Text>
              </View>
            </View>
          </View>

          <View
            className={
              isDesktop ? "flex-row px-5 mt-2 gap-5 items-start" : "px-5 mt-2"
            }
          >
            {/* LEFT: JOB SUMMARY + RECENT JOBS */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
            >
              {/* JOB SUMMARY */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Job summary
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-1">
                      Your booking status breakdown
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => router.push("/provider/bookings")}
                    className="flex-row items-center active:opacity-60"
                  >
                    <Text className="text-[#159A64] text-xs font-bold mr-1">
                      View all
                    </Text>

                    <ArrowRight size={14} color="#159A64" />
                  </Pressable>
                </View>

                <View className="mt-4">
                  {[
                    {
                      label: "Accepted",
                      value: dashboard?.statistics.accepted_jobs ?? 0,
                    },
                    {
                      label: "Assigned",
                      value: dashboard?.statistics.assigned_jobs ?? 0,
                    },
                    {
                      label: "In Progress",
                      value: dashboard?.statistics.in_progress_jobs ?? 0,
                    },
                    {
                      label: "Completed",
                      value: dashboard?.statistics.completed_jobs ?? 0,
                    },
                    {
                      label: "Cancelled",
                      value: dashboard?.statistics.cancelled_jobs ?? 0,
                    },
                  ].map((item, index, array) => (
                    <View
                      key={item.label}
                      className={`flex-row items-center justify-between py-3.5 ${
                        index < array.length - 1
                          ? "border-b border-[#EEF2F6]"
                          : ""
                      }`}
                    >
                      <Text className="text-[#64748B] text-xs">
                        {item.label}
                      </Text>

                      <Text className="text-[#132F57] text-sm font-extrabold">
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* RECENT JOBS */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Recent jobs
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-1">
                      Your latest service activity
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => router.push("/provider/bookings")}
                    className="flex-row items-center active:opacity-60"
                  >
                    <Text className="text-[#159A64] text-xs font-bold mr-1">
                      View all
                    </Text>

                    <ChevronRight size={15} color="#159A64" />
                  </Pressable>
                </View>

                {!dashboard || dashboard.recent_bookings.length === 0 ? (
                  <View className="items-center py-10">
                    <View className="w-16 h-16 rounded-[22px] bg-[#F5F7FA] items-center justify-center">
                      <BriefcaseBusiness size={26} color="#94A3B8" />
                    </View>

                    <Text className="text-[#132F57] text-base font-extrabold mt-4">
                      No recent jobs
                    </Text>

                    <Text className="mt-1 text-center text-xs leading-5 text-[#64748B] max-w-[280px]">
                      Your assigned and completed jobs will appear here.
                    </Text>
                  </View>
                ) : (
                  <View className="mt-4">
                    {dashboard.recent_bookings.map((booking) => {
                      const statusStyle = getStatusStyle(booking.status);

                      return (
                        <Pressable
                          key={booking.id}
                          className="mb-3 rounded-[20px] border border-[#E7ECF2] bg-[#FAFBFC] p-4 active:opacity-75"
                          onPress={() =>
                            router.push({
                              pathname: "/provider/booking/[id]",
                              params: {
                                id: String(booking.id),
                              },
                            })
                          }
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="mr-3 flex-1">
                              <Text className="text-sm font-extrabold text-[#132F57]">
                                {booking.services.name}
                              </Text>

                              <Text className="mt-1 text-[11px] text-[#64748B]">
                                {
                                  booking.users_bookings_customer_idTousers
                                    .full_name
                                }
                              </Text>
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

                          <View className="mt-3 flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 pr-3">
                              <Clock3 size={13} color="#64748B" />

                              <Text className="ml-1.5 text-[10px] text-[#64748B]">
                                {booking.service_area} ·{" "}
                                {formatDate(booking.preferred_date)}
                              </Text>
                            </View>

                            <Text className="font-extrabold text-[#159A64] text-xs">
                              {formatMoney(
                                booking.final_price ?? booking.estimated_price,
                              )}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT: QUICK ACTIONS */}
            <View
              style={{
                width: isDesktop ? 360 : "100%",
                marginTop: isDesktop ? 0 : 16,
              }}
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Quick actions
                </Text>

                <Text className="text-[#64748B] text-[10px] mt-1">
                  Jump to the things you use most
                </Text>

                <Pressable
                  className="flex-row items-center justify-between bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl px-4 py-4 mt-4 active:opacity-70"
                  onPress={() => router.push("/provider/bookings")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <BriefcaseBusiness size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Manage jobs
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Requests and active jobs
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#94A3B8" />
                </Pressable>

                <Pressable
                  className="flex-row items-center justify-between bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl px-4 py-4 mt-3 active:opacity-70"
                  onPress={() => router.push("/provider/earnings")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#EAF8F1] items-center justify-center">
                      <WalletCards size={18} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Earnings
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Income and payouts
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#94A3B8" />
                </Pressable>

                <Pressable
                  className="flex-row items-center justify-between bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl px-4 py-4 mt-3 active:opacity-70"
                  onPress={() => router.push("/provider/profile")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#FFF7E6] items-center justify-center">
                      <ShieldCheck size={18} color="#B7791F" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Provider profile
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Verification and details
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#94A3B8" />
                </Pressable>
              </View>

              <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                  <CircleDollarSign size={20} color="#5DD39E" />
                </View>

                <Text className="text-white text-base font-extrabold mt-4">
                  Keep growing
                </Text>

                <Text className="text-white/65 text-xs leading-5 mt-1">
                  Stay available, respond quickly and complete jobs
                  professionally to build stronger ratings.
                </Text>
              </View>

              <Pressable
                className="mt-4 flex-row items-center justify-between rounded-[20px] border border-[#FECACA] bg-[#FFF7F7] px-4 py-4 active:opacity-70"
                onPress={handleLogout}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-[#FEE2E2] items-center justify-center">
                    <LogOut size={17} color="#DC2626" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#991B1B] text-xs font-bold">
                      Log out
                    </Text>

                    <Text className="text-[#B91C1C] text-[10px] mt-0.5">
                      End provider session
                    </Text>
                  </View>
                </View>

                <ChevronRight size={17} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
