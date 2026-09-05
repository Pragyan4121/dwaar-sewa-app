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
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  History,
  RefreshCw,
  Receipt,
  WalletCards,
} from "lucide-react-native";

import { getProviderWalletTransactions } from "@/api/provider-earnings";

import type { ProviderWalletSummary, ProviderWalletTransaction } from "@/types";

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

function formatText(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProviderTransactionsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [wallet, setWallet] = useState<ProviderWalletSummary | null>(null);

  const [transactions, setTransactions] = useState<ProviderWalletTransaction[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const loadTransactions = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const result = await getProviderWalletTransactions(1, 50);

      setWallet(result.wallet);
      setTransactions(result.transactions);
    } catch (error) {
      console.error("Load provider transactions error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ??
            "Unable to load wallet transactions.",
        );
      } else {
        setErrorMessage("Unable to load wallet transactions.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading wallet transactions...
        </Text>
      </SafeAreaView>
    );
  }

  const walletBalance = Number(wallet?.balance ?? 0);

  const walletIsNegative = walletBalance < 0;

  const totalCredits = transactions
    .filter((transaction) => transaction.transaction_type === "credit")
    .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

  const totalDebits = transactions
    .filter((transaction) => transaction.transaction_type !== "credit")
    .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadTransactions(true);
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
                onPress={() => router.back()}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                className="flex-row items-center rounded-2xl bg-white border border-[#E7ECF2] px-3.5 py-3 active:opacity-70"
                disabled={isRefreshing}
                onPress={() => {
                  void loadTransactions(true);
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
                PROVIDER WALLET
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Wallet activity
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Review every credit, commission deduction and withdrawal in your
                provider wallet.
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
                  <View className="flex-row items-center self-start bg-white/10 rounded-full px-3 py-1.5">
                    <WalletCards size={14} color="#5DD39E" />

                    <Text className="ml-1.5 text-[10px] font-extrabold tracking-wide text-white">
                      CURRENT WALLET
                    </Text>
                  </View>

                  <Text className="mt-4 text-xs font-semibold text-white/60">
                    {walletIsNegative
                      ? "You Owe Dwaar Sewa"
                      : "Current Balance"}
                  </Text>

                  <Text
                    className={`mt-1 text-[30px] font-extrabold ${
                      walletIsNegative ? "text-[#FCA5A5]" : "text-white"
                    }`}
                  >
                    {formatMoney(Math.abs(walletBalance))}
                  </Text>

                  <Text className="mt-1 text-[10px] text-white/50">
                    {wallet?.currency ?? "NPR"}
                  </Text>
                </View>

                <View className={isTablet ? "w-[330px] ml-6" : "mt-5"}>
                  <View className="rounded-[20px] bg-white/10 p-4">
                    <Text className="text-white text-xs font-bold">
                      {walletIsNegative
                        ? "Commission balance due"
                        : "Wallet in good standing"}
                    </Text>

                    <Text className="mt-1 text-[10px] leading-5 text-white/65">
                      {walletIsNegative
                        ? "A negative wallet can result from commission on cash bookings. Future online earnings can automatically settle this amount."
                        : "Credits increase your wallet while withdrawals and commission deductions reduce it."}
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
                    void loadTransactions();
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

          {/* SUMMARY CARDS */}
          <View className="px-5 mt-6">
            <Text className="text-[#132F57] text-xl font-extrabold">
              Activity summary
            </Text>

            <Text className="text-[#64748B] text-xs mt-1">
              Summary of the latest wallet entries loaded on this page
            </Text>

            <View
              className={
                isTablet
                  ? "flex-row gap-3 mt-4"
                  : "flex-row flex-wrap justify-between mt-4"
              }
            >
              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                  <ArrowDownLeft size={18} color="#159A64" />
                </View>

                <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                  {formatMoney(totalCredits)}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">Credits</Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#FFF1F2] items-center justify-center">
                  <ArrowUpRight size={18} color="#DC2626" />
                </View>

                <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                  {formatMoney(totalDebits)}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">Debits</Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                  <History size={18} color="#3563E9" />
                </View>

                <Text className="mt-4 text-[#132F57] text-2xl font-extrabold">
                  {transactions.length}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">
                  Transactions
                </Text>
              </View>
            </View>
          </View>

          {/* MAIN CONTENT */}
          <View
            className={
              isDesktop ? "flex-row px-5 mt-2 gap-5 items-start" : "px-5 mt-2"
            }
          >
            {/* TRANSACTION LIST */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
            >
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-2xl bg-[#F5F7FA] items-center justify-center">
                  <Receipt size={18} color="#64748B" />
                </View>

                <View className="ml-3">
                  <Text className="text-[#132F57] text-xl font-extrabold">
                    Transactions
                  </Text>

                  <Text className="text-[#64748B] text-xs mt-0.5">
                    {transactions.length}{" "}
                    {transactions.length === 1 ? "entry" : "entries"}
                  </Text>
                </View>
              </View>

              {transactions.length === 0 ? (
                <View className="rounded-[26px] border border-[#E7ECF2] bg-white px-6 py-12 items-center">
                  <View className="w-16 h-16 rounded-[22px] bg-[#F5F7FA] items-center justify-center">
                    <History size={26} color="#94A3B8" />
                  </View>

                  <Text className="mt-4 text-lg font-extrabold text-[#132F57]">
                    No transactions yet
                  </Text>

                  <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[290px]">
                    Job earnings, commission deductions and withdrawals will
                    appear here.
                  </Text>
                </View>
              ) : (
                <View>
                  {transactions.map((transaction) => {
                    const isCredit = transaction.transaction_type === "credit";

                    return (
                      <View
                        key={transaction.id}
                        className="mb-4 rounded-[24px] border border-[#E7ECF2] bg-white p-5"
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-row items-start flex-1 pr-3">
                            <View
                              className={`w-11 h-11 rounded-2xl items-center justify-center ${
                                isCredit ? "bg-[#EAF8F1]" : "bg-[#FFF1F2]"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft size={19} color="#159A64" />
                              ) : (
                                <ArrowUpRight size={19} color="#DC2626" />
                              )}
                            </View>

                            <View className="flex-1 ml-3">
                              <Text className="text-[#132F57] text-sm font-extrabold">
                                {transaction.description ??
                                  formatText(transaction.source_type)}
                              </Text>

                              <Text className="mt-1 text-[10px] text-[#64748B]">
                                {formatDateTime(transaction.created_at)}
                              </Text>
                            </View>
                          </View>

                          <Text
                            className={`text-base font-extrabold ${
                              isCredit ? "text-[#159A64]" : "text-[#DC2626]"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatMoney(transaction.amount)}
                          </Text>
                        </View>

                        <View className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">Type</Text>

                            <View
                              className={`rounded-full px-2.5 py-1 ${
                                isCredit ? "bg-[#EAF8F1]" : "bg-[#FFF1F2]"
                              }`}
                            >
                              <Text
                                className={`text-[9px] font-extrabold ${
                                  isCredit ? "text-[#159A64]" : "text-[#DC2626]"
                                }`}
                              >
                                {formatText(transaction.transaction_type)}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-3 flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">
                              Source
                            </Text>

                            <Text className="text-[#132F57] text-xs font-bold text-right ml-3">
                              {formatText(transaction.source_type)}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">
                              Balance before
                            </Text>

                            <Text className="text-[#132F57] text-xs font-semibold">
                              {formatMoney(transaction.balance_before)}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">
                              Balance after
                            </Text>

                            <Text className="text-[#132F57] text-xs font-extrabold">
                              {formatMoney(transaction.balance_after)}
                            </Text>
                          </View>

                          {transaction.bookings ? (
                            <Pressable
                              className="mt-4 rounded-xl bg-white border border-[#D8E4FF] px-4 py-3.5 flex-row items-center justify-center active:opacity-70"
                              onPress={() =>
                                router.push({
                                  pathname: "/provider/booking/[id]",
                                  params: {
                                    id: String(transaction.bookings?.id),
                                  },
                                })
                              }
                            >
                              <Text className="text-xs font-bold text-[#3563E9]">
                                View booking
                              </Text>

                              <ArrowRight
                                size={14}
                                color="#3563E9"
                                style={{
                                  marginLeft: 5,
                                }}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* SIDE ACTIONS */}
            <View
              style={{
                width: isDesktop ? 360 : "100%",
                marginTop: isDesktop ? 0 : 16,
              }}
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Wallet actions
                </Text>

                <Text className="text-[#64748B] text-[10px] mt-1">
                  Manage your wallet and payout
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
                        Request withdrawal
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Transfer wallet funds
                      </Text>
                    </View>
                  </View>

                  <ArrowRight size={16} color="#159A64" />
                </Pressable>

                <Pressable
                  className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-4 active:opacity-70"
                  onPress={() => router.push("/provider/earnings")}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <CreditCard size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Earnings overview
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Review income summary
                      </Text>
                    </View>
                  </View>

                  <ArrowRight size={16} color="#3563E9" />
                </Pressable>
              </View>

              <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                  <Receipt size={20} color="#5DD39E" />
                </View>

                <Text className="text-white text-base font-extrabold mt-4">
                  Understand your balance
                </Text>

                <Text className="text-white/65 text-xs leading-5 mt-1">
                  Every wallet entry records the balance before and after the
                  transaction, making it easier to track credits, commission and
                  withdrawals.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
