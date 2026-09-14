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
  useWindowDimensions,
  View,
} from "react-native";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  History,
  Receipt,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react-native";

import {
  getProviderEarningsHistory,
  getProviderEarningsSummary,
} from "@/api/provider-earnings";

import type {
  ProviderEarningHistoryItem,
  ProviderEarningsSummaryResponse,
} from "@/types";
import { safeBack } from "@/utils/navigation";

interface ApiErrorResponse {
  message?: string;
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `NPR ${value ?? 0}`;
  }

  const sign = amount < 0 ? "-" : "";

  return `${sign}NPR ${Math.abs(amount).toLocaleString(undefined, {
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

export default function ProviderEarningsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [summary, setSummary] =
    useState<ProviderEarningsSummaryResponse | null>(null);

  const [earnings, setEarnings] = useState<ProviderEarningHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const [summaryResult, historyResult] = await Promise.all([
        getProviderEarningsSummary(),
        getProviderEarningsHistory(1, 10),
      ]);

      setSummary(summaryResult);
      setEarnings(historyResult.earnings);
    } catch (error) {
      console.error("Load provider earnings error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to load provider earnings.",
        );
      } else {
        setErrorMessage("Unable to load provider earnings.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">Loading earnings...</Text>
      </SafeAreaView>
    );
  }

  const walletBalance = Number(summary?.wallet.balance ?? 0);

  const amountOwed = Number(summary?.wallet.amount_owed_to_platform ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadData(true);
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
          {/* TOP BAR */}
          <View className="px-5 pt-4">
            <View className="flex-row items-center justify-between">
              <Pressable
                className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
                onPress={() => safeBack(router, "/provider/earnings")}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                className="flex-row items-center rounded-2xl bg-white border border-[#E7ECF2] px-3.5 py-3 active:opacity-70"
                disabled={isRefreshing}
                onPress={() => {
                  void loadData(true);
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
                PROVIDER EARNINGS
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Your earnings
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Track income, commission, wallet balance and payout activity.
              </Text>
            </View>
          </View>

          {/* WALLET HERO */}
          <View className="px-5 mt-5">
            <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
              <View
                className={
                  isTablet ? "flex-row items-center justify-between" : ""
                }
              >
                <View className="flex-1">
                  <View className="flex-row items-center self-start rounded-full bg-white/10 px-3 py-1.5">
                    <WalletCards size={14} color="#5DD39E" />

                    <Text className="ml-1.5 text-[10px] font-extrabold tracking-wide text-white">
                      WALLET
                    </Text>
                  </View>

                  <Text className="mt-4 text-xs font-semibold text-white/60">
                    Available Wallet Balance
                  </Text>

                  <Text className="mt-1 text-[30px] font-extrabold text-white">
                    {formatMoney(Math.max(walletBalance, 0))}
                  </Text>
                  <Text className="mt-1 text-[10px] text-white/50">
                    Available for withdrawal
                  </Text>
                </View>

                {amountOwed > 0 ? (
                  <View className="mt-4 rounded-2xl bg-[#FF5A5A]/15 border border-[#FF5A5A]/30 p-4">
                    <Text className="text-[#FFB4B4] text-xs font-bold">
                      Amount owed to platform
                    </Text>

                    <Text className="mt-1 text-white text-lg font-extrabold">
                      {formatMoney(amountOwed)}
                    </Text>

                    <Text className="mt-1 text-[10px] text-white/60">
                      This will be deducted automatically from your future
                      online-payment earnings.
                    </Text>
                  </View>
                ) : null}

                <View className={isTablet ? "w-[330px] ml-6" : "mt-5"}>
                  <View className="bg-white/10 rounded-[20px] p-4">
                    <Text className="text-white text-xs font-bold">
                      {walletBalance > 0
                        ? "Ready for withdrawal"
                        : "No withdrawable balance"}
                    </Text>

                    <Text className="mt-1 text-[10px] leading-5 text-white/65">
                      {walletBalance > 0
                        ? "Your current wallet balance can be used for eligible withdrawal requests."
                        : "Complete eligible jobs to build your available wallet balance."}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                <Text className="text-xs leading-5 font-semibold text-[#BE123C]">
                  {errorMessage}
                </Text>

                <Pressable
                  className="mt-3 self-start rounded-xl border border-[#FECDD3] bg-white px-4 py-2.5 flex-row items-center active:opacity-70"
                  onPress={() => {
                    void loadData();
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

          {/* EARNINGS OVERVIEW */}
          <View className="px-5 mt-6">
            <Text className="text-[#132F57] text-xl font-extrabold">
              Earnings overview
            </Text>

            <Text className="text-[#64748B] text-xs mt-1">
              Your income across recent periods
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
                  label: "Today",
                  value: summary?.earnings.today ?? 0,
                  icon: CircleDollarSign,
                  iconColor: "#159A64",
                  iconBg: "bg-[#EAF8F1]",
                },
                {
                  label: "This week",
                  value: summary?.earnings.this_week ?? 0,
                  icon: CalendarDays,
                  iconColor: "#3563E9",
                  iconBg: "bg-[#EEF4FF]",
                },
                {
                  label: "This month",
                  value: summary?.earnings.this_month ?? 0,
                  icon: TrendingUp,
                  iconColor: "#6D44C5",
                  iconBg: "bg-[#F3F0FF]",
                },
                {
                  label: "Total net",
                  value: summary?.earnings.total_net ?? 0,
                  icon: CheckCircle2,
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
                      {formatMoney(item.value)}
                    </Text>

                    <Text className="mt-1 text-[11px] text-[#64748B]">
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* TWO COLUMN AREA */}
          <View
            className={
              isDesktop ? "flex-row px-5 mt-2 gap-5 items-start" : "px-5 mt-2"
            }
          >
            {/* LEFT */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
            >
              {/* SUMMARY */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-[#F5F7FA] items-center justify-center">
                    <Receipt size={18} color="#64748B" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Earnings summary
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-0.5">
                      Gross, commission and payout totals
                    </Text>
                  </View>
                </View>

                <View className="mt-4">
                  {[
                    {
                      label: "Total gross earnings",
                      value: formatMoney(summary?.earnings.total_gross ?? 0),
                      valueClass: "text-[#132F57]",
                    },
                    {
                      label: "Dwaar Sewa commission",
                      value: `- ${formatMoney(
                        summary?.earnings.total_commission ?? 0,
                      )}`,
                      valueClass: "text-[#DC2626]",
                    },
                    {
                      label: "Completed jobs",
                      value: String(summary?.earnings.completed_jobs ?? 0),
                      valueClass: "text-[#132F57]",
                    },
                    {
                      label: "Pending withdrawals",
                      value: formatMoney(
                        summary?.withdrawals.pending_amount ?? 0,
                      ),
                      valueClass: "text-[#B7791F]",
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

                      <Text
                        className={`text-sm font-extrabold ${item.valueClass}`}
                      >
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* RECENT EARNINGS */}
              <View className="mt-5">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-[#132F57] text-xl font-extrabold">
                      Recent earnings
                    </Text>

                    <Text className="text-[#64748B] text-xs mt-1">
                      Latest completed-job income
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => router.push("/provider/transactions")}
                    className="flex-row items-center active:opacity-70"
                  >
                    <Text className="text-[#159A64] text-xs font-bold">
                      View all
                    </Text>

                    <ArrowRight
                      size={14}
                      color="#159A64"
                      style={{
                        marginLeft: 4,
                      }}
                    />
                  </Pressable>
                </View>

                {earnings.length === 0 ? (
                  <View className="items-center rounded-[26px] border border-[#E7ECF2] bg-white px-6 py-12">
                    <View className="w-16 h-16 rounded-[22px] bg-[#F5F7FA] items-center justify-center">
                      <History size={26} color="#94A3B8" />
                    </View>

                    <Text className="mt-4 text-lg font-extrabold text-[#132F57]">
                      No earnings yet
                    </Text>

                    <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[280px]">
                      Completed jobs will appear here.
                    </Text>
                  </View>
                ) : (
                  <View>
                    {earnings.map((earning) => {
                      const isCash =
                        earning.status === "cash_collected_by_provider";

                      return (
                        <View
                          key={earning.id}
                          className="mb-4 rounded-[24px] border border-[#E7ECF2] bg-white p-5"
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
                              </Text>
                            </View>

                            <View
                              className={`rounded-full px-3 py-1.5 ${
                                isCash ? "bg-[#FFF7E6]" : "bg-[#EAF8F1]"
                              }`}
                            >
                              <Text
                                className={`text-xs font-extrabold ${
                                  isCash ? "text-[#B7791F]" : "text-[#159A64]"
                                }`}
                              >
                                {isCash
                                  ? "Cash"
                                  : `+${formatMoney(earning.net_amount)}`}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-4 bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl p-4">
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-[#64748B]">
                                Gross
                              </Text>

                              <Text className="text-xs font-bold text-[#132F57]">
                                {formatMoney(earning.gross_amount)}
                              </Text>
                            </View>

                            <View className="mt-3 flex-row justify-between">
                              <Text className="text-xs text-[#64748B]">
                                Commission
                              </Text>

                              <Text className="text-xs font-bold text-[#DC2626]">
                                {formatMoney(earning.commission_amount)}
                              </Text>
                            </View>

                            <View className="mt-3 flex-row justify-between">
                              <Text className="text-xs text-[#64748B]">
                                Date
                              </Text>

                              <Text className="text-xs font-bold text-[#132F57]">
                                {formatDate(
                                  earning.credited_at ?? earning.created_at,
                                )}
                              </Text>
                            </View>

                            <View className="mt-3 flex-row justify-between items-start">
                              <Text className="text-xs text-[#64748B]">
                                Status
                              </Text>

                              <Text
                                className={`text-xs font-bold text-right ml-3 ${
                                  isCash ? "text-[#B7791F]" : "text-[#159A64]"
                                }`}
                              >
                                {formatStatus(earning.status)}
                              </Text>
                            </View>

                            {isCash ? (
                              <View className="mt-3 rounded-xl bg-[#FFF7E6] px-3 py-3">
                                <Text className="text-[10px] leading-5 text-[#92400E]">
                                  You collected this payment in cash. Only the
                                  commission (
                                  {formatMoney(earning.commission_amount)}) was
                                  deducted from your wallet.
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT */}
            <View
              style={{
                width: isDesktop ? 360 : "100%",
                marginTop: isDesktop ? 0 : 16,
              }}
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Money actions
                </Text>

                <Text className="text-[#64748B] text-[10px] mt-1">
                  Withdraw funds or review your history
                </Text>

                <Pressable
                  className="mt-4 flex-row items-center justify-between rounded-2xl bg-[#EAF8F1] border border-[#CDEBD9] px-4 py-4 active:opacity-70"
                  onPress={() => router.push("/provider/withdrawals")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
                      <WalletCards size={18} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Withdraw
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Request a payout
                      </Text>
                    </View>
                  </View>

                  <ArrowRight size={16} color="#159A64" />
                </Pressable>

                <Pressable
                  className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-4 active:opacity-70"
                  onPress={() => router.push("/provider/transactions")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <CreditCard size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Transactions
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Wallet activity
                      </Text>
                    </View>
                  </View>

                  <ArrowRight size={16} color="#3563E9" />
                </Pressable>

                <Pressable
                  className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-4 active:opacity-70"
                  onPress={() => router.push("/provider/earnings-statement")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#FFF7E6] items-center justify-center">
                      <Receipt size={18} color="#B7791F" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Monthly statement
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Older months and summaries
                      </Text>
                    </View>
                  </View>

                  <ArrowRight size={16} color="#B7791F" />
                </Pressable>
              </View>

              <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                  <Banknote size={20} color="#5DD39E" />
                </View>

                <Text className="text-white text-base font-extrabold mt-4">
                  Earnings tip
                </Text>

                <Text className="text-white/65 text-xs leading-5 mt-1">
                  Complete jobs accurately and keep your wallet activity up to
                  date to make payout tracking easier.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
