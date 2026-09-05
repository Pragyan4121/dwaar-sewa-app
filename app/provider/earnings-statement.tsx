import axios from "axios";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
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
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";

import {
  getProviderEarningsStatementByMonth,
  getProviderEarningsStatementByRange,
} from "@/api/provider-earnings";

import type {
  ProviderEarningHistoryItem,
  ProviderEarningsStatementRange,
  ProviderEarningsStatementSummary,
} from "@/types";

interface ApiErrorResponse {
  message?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MAX_RANGE_DAYS = 90;

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `NPR ${value ?? 0}`;
  }

  return `NPR ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime());
}

type ViewMode = "month" | "range";

export default function ProviderEarningsStatementScreen() {
  const now = new Date();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [mode, setMode] = useState<ViewMode>("month");

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [rangeStart, setRangeStart] = useState(
    toDateOnlyString(new Date(now.getFullYear(), now.getMonth(), 1)),
  );

  const [rangeEnd, setRangeEnd] = useState(toDateOnlyString(now));

  const [range, setRange] = useState<ProviderEarningsStatementRange | null>(
    null,
  );

  const [summary, setSummary] =
    useState<ProviderEarningsStatementSummary | null>(null);

  const [earnings, setEarnings] = useState<ProviderEarningHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const loadMonth = useCallback(
    async (year: number, month: number, refresh = false) => {
      try {
        refresh ? setIsRefreshing(true) : setIsLoading(true);

        setErrorMessage("");

        const result = await getProviderEarningsStatementByMonth(year, month);

        setRange(result.range);
        setSummary(result.summary);
        setEarnings(result.earnings);
      } catch (error) {
        console.error("Load earnings statement error:", error);

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data?.message ??
              "Unable to load the earnings statement.",
          );
        } else {
          setErrorMessage("Unable to load the earnings statement.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  const loadRange = useCallback(
    async (startDate: string, endDate: string, refresh = false) => {
      if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
        setErrorMessage("Enter valid dates in YYYY-MM-DD format.");

        return;
      }

      const spanDays =
        (new Date(`${endDate}T00:00:00.000Z`).getTime() -
          new Date(`${startDate}T00:00:00.000Z`).getTime()) /
        (1000 * 60 * 60 * 24);

      if (spanDays < 0) {
        setErrorMessage("Start date must be before the end date.");

        return;
      }

      if (spanDays > MAX_RANGE_DAYS) {
        setErrorMessage(`You can view up to ${MAX_RANGE_DAYS} days at a time.`);

        return;
      }

      try {
        refresh ? setIsRefreshing(true) : setIsLoading(true);

        setErrorMessage("");

        const result = await getProviderEarningsStatementByRange(
          startDate,
          endDate,
        );

        setRange(result.range);
        setSummary(result.summary);
        setEarnings(result.earnings);
      } catch (error) {
        console.error("Load earnings statement error:", error);

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data?.message ??
              "Unable to load the earnings statement.",
          );
        } else {
          setErrorMessage("Unable to load the earnings statement.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (mode === "month") {
      void loadMonth(selectedYear, selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedYear, selectedMonth]);

  function goToPreviousMonth() {
    setSelectedMonth((current) => {
      if (current === 1) {
        setSelectedYear((year) => year - 1);

        return 12;
      }

      return current - 1;
    });
  }

  function goToNextMonth() {
    const isCurrentMonth =
      selectedYear === now.getFullYear() &&
      selectedMonth === now.getMonth() + 1;

    if (isCurrentMonth) {
      return;
    }

    setSelectedMonth((current) => {
      if (current === 12) {
        setSelectedYear((year) => year + 1);

        return 1;
      }

      return current + 1;
    });
  }

  const isCurrentMonthSelected =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  function handleRefresh() {
    if (mode === "month") {
      void loadMonth(selectedYear, selectedMonth, true);
    } else {
      void loadRange(rangeStart, rangeEnd, true);
    }
  }

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
        >
          {/* TOP BAR */}
          <View className="px-5 pt-4">
            <View className="flex-row items-center justify-between">
              <Pressable
                className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                onPress={() => router.back()}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                className="flex-row items-center rounded-2xl bg-white border border-[#E7ECF2] px-3.5 py-3 active:opacity-70"
                disabled={isRefreshing}
                onPress={handleRefresh}
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
                PROVIDER STATEMENT
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Earnings statement
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Review gross earnings, commission and net payout by month or
                custom date range.
              </Text>
            </View>
          </View>

          {/* HERO */}
          <View className="px-5 mt-5">
            <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
              <View
                className={
                  isTablet ? "flex-row items-center justify-between" : ""
                }
              >
                <View className="flex-1">
                  <View className="flex-row items-center self-start bg-white/10 rounded-full px-3 py-1.5">
                    <Receipt size={14} color="#5DD39E" />

                    <Text className="ml-1.5 text-[10px] font-extrabold tracking-wide text-white">
                      STATEMENT OVERVIEW
                    </Text>
                  </View>

                  <Text className="mt-4 text-white text-xl font-extrabold">
                    {mode === "month"
                      ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                      : "Custom date range"}
                  </Text>

                  <Text className="mt-1 text-white/60 text-xs leading-5">
                    {range
                      ? `${formatDate(range.start_date)} — ${formatDate(
                          range.end_date,
                        )}`
                      : "Choose a period to view your statement."}
                  </Text>
                </View>

                <View className={isTablet ? "w-[330px] ml-6" : "mt-5"}>
                  <View className="rounded-[20px] bg-white/10 p-4">
                    <Text className="text-white text-xs font-bold">
                      Net payout
                    </Text>

                    <Text className="mt-1 text-[24px] font-extrabold text-[#5DD39E]">
                      {formatMoney(summary?.total_net ?? 0)}
                    </Text>

                    <Text className="mt-1 text-[10px] text-white/55">
                      After Dwaar Sewa commission
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* MODE TOGGLE */}
          <View className="px-5 mt-4">
            <View className="flex-row rounded-[18px] bg-white border border-[#E7ECF2] p-1.5">
              <Pressable
                onPress={() => setMode("month")}
                className={`flex-1 items-center rounded-[14px] py-3 ${
                  mode === "month" ? "bg-[#159A64]" : ""
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    mode === "month" ? "text-white" : "text-[#64748B]"
                  }`}
                >
                  By Month
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode("range")}
                className={`flex-1 items-center rounded-[14px] py-3 ${
                  mode === "range" ? "bg-[#159A64]" : ""
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    mode === "range" ? "text-white" : "text-[#64748B]"
                  }`}
                >
                  Custom Range
                </Text>
              </Pressable>
            </View>
          </View>

          {/* PERIOD CONTROLS */}
          <View className="px-5 mt-4">
            {mode === "month" ? (
              <View className="rounded-[24px] bg-white border border-[#E7ECF2] p-4">
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={goToPreviousMonth}
                    className="w-10 h-10 rounded-xl bg-[#F5F7FA] items-center justify-center active:opacity-70"
                  >
                    <ChevronLeft size={18} color="#132F57" />
                  </Pressable>

                  <View className="items-center">
                    <Text className="text-[#64748B] text-[10px] font-bold">
                      SELECTED MONTH
                    </Text>

                    <Text className="text-[#132F57] text-base font-extrabold mt-1">
                      {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                    </Text>
                  </View>

                  <Pressable
                    onPress={goToNextMonth}
                    disabled={isCurrentMonthSelected}
                    className={`w-10 h-10 rounded-xl items-center justify-center ${
                      isCurrentMonthSelected
                        ? "bg-[#F8FAFC]"
                        : "bg-[#F5F7FA] active:opacity-70"
                    }`}
                  >
                    <ChevronRight
                      size={18}
                      color={isCurrentMonthSelected ? "#CBD5E1" : "#132F57"}
                    />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="rounded-[24px] bg-white border border-[#E7ECF2] p-5">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                    <CalendarDays size={18} color="#3563E9" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-sm font-extrabold">
                      Custom date range
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-0.5">
                      Maximum {MAX_RANGE_DAYS} days
                    </Text>
                  </View>
                </View>

                <View
                  className={isTablet ? "flex-row gap-3 mt-5" : "gap-3 mt-5"}
                >
                  <View style={{ flex: 1 }}>
                    <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                      Start date
                    </Text>

                    <TextInput
                      value={rangeStart}
                      onChangeText={setRangeStart}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      className="rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3.5 text-[#132F57]"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                      End date
                    </Text>

                    <TextInput
                      value={rangeEnd}
                      onChangeText={setRangeEnd}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      className="rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3.5 text-[#132F57]"
                    />
                  </View>
                </View>

                <Pressable
                  onPress={() => void loadRange(rangeStart, rangeEnd)}
                  className="mt-4 rounded-2xl bg-[#159A64] py-4 flex-row items-center justify-center active:opacity-80"
                >
                  <CalendarDays size={16} color="#FFFFFF" />

                  <Text className="ml-2 text-white text-sm font-bold">
                    View statement
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                <Text className="text-xs leading-5 font-semibold text-[#BE123C]">
                  {errorMessage}
                </Text>
              </View>
            </View>
          ) : null}

          {isLoading ? (
            <View className="mt-10 items-center">
              <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
                <ActivityIndicator color="#159A64" />
              </View>

              <Text className="mt-3 text-xs text-[#64748B]">
                Loading statement...
              </Text>
            </View>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <View className="px-5 mt-6">
                <Text className="text-[#132F57] text-xl font-extrabold">
                  Statement summary
                </Text>

                <Text className="text-[#64748B] text-xs mt-1">
                  Key totals for the selected period
                </Text>

                <View
                  className={
                    isTablet
                      ? "flex-row gap-3 mt-4"
                      : "flex-row flex-wrap justify-between mt-4"
                  }
                >
                  {[
                    {
                      label: "Completed jobs",
                      value: String(summary?.completed_jobs ?? 0),
                      icon: CheckCircle2,
                      iconColor: "#3563E9",
                      iconBg: "bg-[#EEF4FF]",
                    },
                    {
                      label: "Gross earned",
                      value: formatMoney(summary?.total_gross ?? 0),
                      icon: TrendingUp,
                      iconColor: "#159A64",
                      iconBg: "bg-[#EAF8F1]",
                    },
                    {
                      label: "Commission",
                      value: formatMoney(summary?.total_commission ?? 0),
                      icon: TrendingDown,
                      iconColor: "#DC2626",
                      iconBg: "bg-[#FFF1F2]",
                    },
                    {
                      label: "Net payout",
                      value: formatMoney(summary?.total_net ?? 0),
                      icon: CircleDollarSign,
                      iconColor: "#B7791F",
                      iconBg: "bg-[#FFF7E6]",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <View
                        key={item.label}
                        className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                        style={{
                          width: isTablet ? undefined : "48.5%",
                          flex: isTablet ? 1 : undefined,
                        }}
                      >
                        <View
                          className={`w-10 h-10 rounded-2xl items-center justify-center ${item.iconBg}`}
                        >
                          <Icon size={18} color={item.iconColor} />
                        </View>

                        <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                          {item.value}
                        </Text>

                        <Text className="mt-1 text-[11px] text-[#64748B]">
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* COMMISSION SUMMARY */}
              <View className="px-5 mt-2">
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Commission summary
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-1">
                        Dwaar Sewa platform commission for this period
                      </Text>
                    </View>

                    {summary && summary.average_commission_percentage > 0 ? (
                      <View className="bg-[#FFF7E6] rounded-full px-3 py-1.5">
                        <Text className="text-[#B7791F] text-[10px] font-extrabold">
                          AVG {summary.average_commission_percentage}%
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[#64748B] text-xs">
                        Gross earned
                      </Text>

                      <Text className="text-[#132F57] text-sm font-extrabold">
                        {formatMoney(summary?.total_gross ?? 0)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-[#64748B] text-xs">Commission</Text>

                      <Text className="text-[#DC2626] text-sm font-extrabold">
                        - {formatMoney(summary?.total_commission ?? 0)}
                      </Text>
                    </View>

                    <View className="h-px bg-[#E7ECF2] my-3" />

                    <View className="flex-row items-center justify-between">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Net payout
                      </Text>

                      <Text className="text-[#159A64] text-lg font-extrabold">
                        {formatMoney(summary?.total_net ?? 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* STATEMENT LIST */}
              <View className="px-5 mt-6">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-[#F5F7FA] items-center justify-center">
                    <Receipt size={18} color="#64748B" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-xl font-extrabold">
                      Statement
                    </Text>

                    <Text className="text-[#64748B] text-xs mt-0.5">
                      {earnings.length}{" "}
                      {earnings.length === 1
                        ? "earning entry"
                        : "earning entries"}
                    </Text>
                  </View>
                </View>

                {earnings.length === 0 ? (
                  <View className="mt-4 items-center rounded-[26px] border border-[#E7ECF2] bg-white px-6 py-12">
                    <View className="w-16 h-16 rounded-[22px] bg-[#F5F7FA] items-center justify-center">
                      <Receipt size={26} color="#94A3B8" />
                    </View>

                    <Text className="mt-4 text-lg font-extrabold text-[#132F57]">
                      No earnings in this period
                    </Text>

                    <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[290px]">
                      Completed jobs in the selected period will appear here.
                    </Text>
                  </View>
                ) : (
                  <View
                    className={
                      isDesktop ? "flex-row flex-wrap gap-4 mt-4" : "mt-4"
                    }
                  >
                    {earnings.map((earning) => (
                      <View
                        key={earning.id}
                        className="mb-4 rounded-[24px] border border-[#E7ECF2] bg-white p-5"
                        style={{
                          width: isDesktop ? "48.9%" : "100%",
                        }}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="text-[#132F57] text-base font-extrabold">
                              {earning.bookings.services.name}
                            </Text>

                            <Text className="mt-1 text-xs text-[#64748B]">
                              {
                                earning.bookings
                                  .users_bookings_customer_idTousers.full_name
                              }
                              {earning.bookings
                                .users_bookings_customer_idTousers.phone
                                ? ` · ${
                                    earning.bookings
                                      .users_bookings_customer_idTousers.phone
                                  }`
                                : ""}
                            </Text>

                            <Text className="mt-1 text-[10px] text-[#94A3B8]">
                              {formatDate(
                                earning.credited_at ?? earning.created_at,
                              )}
                            </Text>
                          </View>

                          <Text className="text-[#159A64] text-base font-extrabold">
                            +{formatMoney(earning.net_amount)}
                          </Text>
                        </View>

                        <View className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-[#64748B]">
                              Gross amount
                            </Text>

                            <Text className="text-xs font-bold text-[#132F57]">
                              {formatMoney(earning.gross_amount)}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row justify-between">
                            <Text className="text-xs text-[#64748B]">
                              Commission (
                              {Number(earning.commission_percentage)}
                              %)
                            </Text>

                            <Text className="text-xs font-bold text-[#DC2626]">
                              - {formatMoney(earning.commission_amount)}
                            </Text>
                          </View>

                          <View className="h-px bg-[#E7ECF2] my-3" />

                          <View className="flex-row justify-between">
                            <Text className="text-xs font-bold text-[#132F57]">
                              Net earning
                            </Text>

                            <Text className="text-sm font-extrabold text-[#159A64]">
                              {formatMoney(earning.net_amount)}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row justify-between items-center">
                            <Text className="text-xs text-[#64748B]">
                              Status
                            </Text>

                            <View className="rounded-full bg-[#EAF8F1] px-2.5 py-1">
                              <Text className="text-[9px] font-extrabold text-[#159A64]">
                                {formatStatus(earning.status)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* BACK ACTION */}
              <View className="px-5 mt-2">
                <Pressable
                  onPress={() => router.push("/provider/earnings")}
                  className="rounded-[20px] border border-[#E7ECF2] bg-white px-4 py-4 flex-row items-center justify-between active:opacity-70"
                >
                  <View>
                    <Text className="text-[#132F57] text-xs font-bold">
                      Back to earnings
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-0.5">
                      Return to wallet and earnings overview
                    </Text>
                  </View>

                  <ArrowRight size={17} color="#159A64" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
