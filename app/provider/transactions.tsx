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
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  History,
  RefreshCw,
  Receipt,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

function formatText(value: string | null | undefined) {
  if (!value) {
    return "Wallet activity";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProviderTransactionsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
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

  const walletBalance = Number(wallet?.balance ?? 0);
  const walletIsNegative = walletBalance < 0;

  const summary = useMemo(() => {
    const credits = transactions
      .filter((transaction) => transaction.transaction_type === "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

    const debits = transactions
      .filter((transaction) => transaction.transaction_type !== "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

    return {
      credits,
      debits,
      count: transactions.length,
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F9FC] items-center justify-center">
        <View className="w-[74px] h-[74px] rounded-[26px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-4 text-[#132F57] text-sm font-bold">
          Loading wallet
        </Text>

        <Text className="mt-1 text-[#94A3B8] text-xs">
          Getting your latest activity...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]">
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
                className="w-11 h-11 rounded-2xl bg-white border border-[#E6EBF1] items-center justify-center active:opacity-70"
                onPress={() => router.back()}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                disabled={isRefreshing}
                onPress={() => {
                  void loadTransactions(true);
                }}
                className="h-11 px-4 rounded-2xl bg-white border border-[#E6EBF1] flex-row items-center justify-center active:opacity-70"
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#159A64" />
                ) : (
                  <RefreshCw size={15} color="#159A64" />
                )}

                <Text className="ml-2 text-[#132F57] text-xs font-extrabold">
                  {isRefreshing ? "Refreshing" : "Refresh"}
                </Text>
              </Pressable>
            </View>

            <View className="mt-6">
              <Text className="text-[#159A64] text-[10px] font-extrabold tracking-[1.7px]">
                PROVIDER WALLET
              </Text>

              <Text
                className={`mt-1 text-[#132F57] font-extrabold ${
                  isTablet ? "text-[32px]" : "text-[27px]"
                }`}
              >
                Wallet & transactions
              </Text>

              <Text className="mt-2 text-[#64748B] text-sm leading-5 max-w-[620px]">
                Track your earnings, commission adjustments, withdrawals and
                wallet balance in one place.
              </Text>
            </View>
          </View>

          {/* WALLET BALANCE */}
          <View className="px-5 mt-6">
            <View className="rounded-[30px] bg-[#102A4C] overflow-hidden">
              <View className="p-6">
                <View
                  className={
                    isTablet ? "flex-row items-center justify-between" : ""
                  }
                >
                  <View className="flex-1">
                    <View className="self-start flex-row items-center rounded-full bg-white/10 px-3 py-2">
                      <WalletCards size={15} color="#6EE7B7" />

                      <Text className="ml-2 text-white text-[10px] font-extrabold tracking-[1px]">
                        WALLET BALANCE
                      </Text>
                    </View>

                    <Text className="mt-6 text-white/60 text-xs font-semibold">
                      {walletIsNegative
                        ? "Amount payable to Dwaar Sewa"
                        : "Available balance"}
                    </Text>

                    <Text
                      className={`mt-1 font-extrabold ${
                        isTablet ? "text-[38px]" : "text-[32px]"
                      } ${walletIsNegative ? "text-[#FDA4AF]" : "text-white"}`}
                    >
                      {formatMoney(Math.abs(walletBalance))}
                    </Text>

                    <View className="mt-3 flex-row items-center">
                      <View
                        className={`rounded-full px-3 py-1.5 ${
                          walletIsNegative
                            ? "bg-[#7F1D1D]/35"
                            : "bg-[#159A64]/25"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-extrabold ${
                            walletIsNegative
                              ? "text-[#FECACA]"
                              : "text-[#A7F3D0]"
                          }`}
                        >
                          {walletIsNegative ? "PAYMENT DUE" : "GOOD STANDING"}
                        </Text>
                      </View>

                      <Text className="ml-2 text-white/45 text-[10px]">
                        {wallet?.currency ?? "NPR"}
                      </Text>
                    </View>
                  </View>

                  <View className={isTablet ? "w-[345px] ml-7" : "mt-6"}>
                    <View className="rounded-[22px] bg-white/10 border border-white/10 p-4">
                      <View className="flex-row items-start">
                        <View className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center">
                          <ShieldCheck size={18} color="#6EE7B7" />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text className="text-white text-xs font-extrabold">
                            {walletIsNegative
                              ? "Commission balance due"
                              : "Your wallet is healthy"}
                          </Text>

                          <Text className="mt-1 text-white/60 text-[10px] leading-5">
                            {walletIsNegative
                              ? "Cash booking commissions can create a negative balance. Future eligible earnings may offset the amount."
                              : "Your current wallet balance is positive. Withdraw available earnings whenever eligible."}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[22px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                <Text className="text-[#BE123C] text-xs font-bold leading-5">
                  {errorMessage}
                </Text>

                <Pressable
                  className="mt-3 self-start flex-row items-center bg-white border border-[#FECDD3] rounded-xl px-4 py-2.5 active:opacity-70"
                  onPress={() => {
                    void loadTransactions();
                  }}
                >
                  <RefreshCw size={14} color="#BE123C" />

                  <Text className="ml-2 text-[#BE123C] text-xs font-extrabold">
                    Try again
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* SUMMARY */}
          <View className="px-5 mt-7">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Wallet overview
                </Text>

                <Text className="mt-1 text-[#94A3B8] text-[10px]">
                  Based on recent wallet activity
                </Text>
              </View>

              <View className="rounded-full bg-[#EEF4FF] px-3 py-1.5">
                <Text className="text-[#3563E9] text-[10px] font-extrabold">
                  {summary.count} entries
                </Text>
              </View>
            </View>

            <View
              className={
                isTablet
                  ? "flex-row mt-4"
                  : "flex-row flex-wrap justify-between mt-4"
              }
            >
              {/* CREDITS */}
              <View
                className={`rounded-[22px] bg-white border border-[#E7ECF2] p-4 ${
                  isTablet ? "flex-1 mr-3" : "mb-3"
                }`}
                style={{
                  width: isTablet ? undefined : "48.5%",
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                  <TrendingUp size={18} color="#159A64" />
                </View>

                <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                  {formatMoney(summary.credits)}
                </Text>

                <Text className="mt-1 text-[#64748B] text-[10px] font-semibold">
                  Money credited
                </Text>
              </View>

              {/* DEBITS */}
              <View
                className={`rounded-[22px] bg-white border border-[#E7ECF2] p-4 ${
                  isTablet ? "flex-1 mr-3" : "mb-3"
                }`}
                style={{
                  width: isTablet ? undefined : "48.5%",
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#FFF1F2] items-center justify-center">
                  <TrendingDown size={18} color="#DC2626" />
                </View>

                <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                  {formatMoney(summary.debits)}
                </Text>

                <Text className="mt-1 text-[#64748B] text-[10px] font-semibold">
                  Money debited
                </Text>
              </View>

              {/* ENTRIES */}
              <View
                className="rounded-[22px] bg-white border border-[#E7ECF2] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "100%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                  <History size={18} color="#3563E9" />
                </View>

                <Text className="mt-4 text-[#132F57] text-xl font-extrabold">
                  {summary.count}
                </Text>

                <Text className="mt-1 text-[#64748B] text-[10px] font-semibold">
                  Recent transactions
                </Text>
              </View>
            </View>
          </View>

          {/* CONTENT */}
          <View
            className={
              isDesktop ? "flex-row px-5 mt-3 items-start" : "px-5 mt-3"
            }
          >
            {/* TRANSACTION AREA */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
                marginRight: isDesktop ? 20 : 0,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-[#EEF2F6] items-center justify-center">
                    <Receipt size={18} color="#64748B" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Recent transactions
                    </Text>

                    <Text className="text-[#94A3B8] text-[10px] mt-0.5">
                      Latest wallet movements
                    </Text>
                  </View>
                </View>
              </View>

              {transactions.length === 0 ? (
                <View className="rounded-[28px] bg-white border border-[#E7ECF2] px-6 py-14 items-center">
                  <View className="w-16 h-16 rounded-[24px] bg-[#F5F7FA] items-center justify-center">
                    <History size={25} color="#94A3B8" />
                  </View>

                  <Text className="mt-4 text-[#132F57] text-lg font-extrabold">
                    No wallet activity yet
                  </Text>

                  <Text className="mt-2 max-w-[310px] text-center text-[#64748B] text-xs leading-5">
                    Earnings, commission adjustments and withdrawal transactions
                    will appear here.
                  </Text>
                </View>
              ) : (
                <View>
                  {transactions.map((transaction) => {
                    const isCredit = transaction.transaction_type === "credit";

                    return (
                      <View
                        key={transaction.id}
                        className="mb-3 rounded-[24px] bg-white border border-[#E7ECF2] overflow-hidden"
                      >
                        <View className="p-4">
                          <View className="flex-row items-start">
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

                            <View className="ml-3 flex-1">
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1 pr-3">
                                  <Text className="text-[#132F57] text-sm font-extrabold">
                                    {transaction.description ??
                                      formatText(transaction.source_type)}
                                  </Text>

                                  <View className="mt-1.5 flex-row items-center">
                                    <Clock3 size={11} color="#94A3B8" />

                                    <Text className="ml-1 text-[#94A3B8] text-[10px]">
                                      {formatDateTime(transaction.created_at)}
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  className={`text-sm font-extrabold ${
                                    isCredit
                                      ? "text-[#159A64]"
                                      : "text-[#DC2626]"
                                  }`}
                                >
                                  {isCredit ? "+" : "-"}
                                  {formatMoney(transaction.amount)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View className="mt-4 h-px bg-[#F0F3F6]" />

                          <View className="mt-4 flex-row flex-wrap">
                            <View className="mr-6 mb-3">
                              <Text className="text-[#94A3B8] text-[9px] font-bold">
                                TYPE
                              </Text>

                              <Text className="mt-1 text-[#132F57] text-xs font-bold">
                                {formatText(transaction.transaction_type)}
                              </Text>
                            </View>

                            <View className="mr-6 mb-3">
                              <Text className="text-[#94A3B8] text-[9px] font-bold">
                                SOURCE
                              </Text>

                              <Text className="mt-1 text-[#132F57] text-xs font-bold">
                                {formatText(transaction.source_type)}
                              </Text>
                            </View>

                            <View className="mb-3">
                              <Text className="text-[#94A3B8] text-[9px] font-bold">
                                BALANCE AFTER
                              </Text>

                              <Text className="mt-1 text-[#132F57] text-xs font-extrabold">
                                {formatMoney(transaction.balance_after)}
                              </Text>
                            </View>
                          </View>

                          <View className="rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-3">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-[#64748B] text-[10px]">
                                Previous balance
                              </Text>

                              <Text className="text-[#132F57] text-[10px] font-bold">
                                {formatMoney(transaction.balance_before)}
                              </Text>
                            </View>

                            <View className="mt-2 flex-row items-center justify-between">
                              <Text className="text-[#64748B] text-[10px]">
                                New balance
                              </Text>

                              <Text className="text-[#132F57] text-[10px] font-extrabold">
                                {formatMoney(transaction.balance_after)}
                              </Text>
                            </View>
                          </View>

                          {transaction.bookings ? (
                            <Pressable
                              className="mt-3 h-11 rounded-2xl bg-[#EEF4FF] border border-[#DCE7FF] flex-row items-center justify-center active:opacity-70"
                              onPress={() =>
                                router.push({
                                  pathname: "/provider/booking/[id]",
                                  params: {
                                    id: String(transaction.bookings?.id),
                                  },
                                })
                              }
                            >
                              <Text className="text-[#3563E9] text-xs font-extrabold">
                                View related booking
                              </Text>

                              <ChevronRight
                                size={15}
                                color="#3563E9"
                                style={{
                                  marginLeft: 4,
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

            {/* WALLET ACTIONS */}
            <View
              style={{
                width: isDesktop ? 350 : "100%",
                marginTop: isDesktop ? 0 : 18,
              }}
            >
              <View className="rounded-[26px] bg-white border border-[#E7ECF2] p-5">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Wallet actions
                </Text>

                <Text className="mt-1 text-[#94A3B8] text-[10px]">
                  Manage earnings and payouts
                </Text>

                <Pressable
                  onPress={() => router.push("/provider/withdrawals")}
                  className="mt-5 rounded-[20px] bg-[#EAF8F1] border border-[#D2EEE0] p-4 flex-row items-center active:opacity-70"
                >
                  <View className="w-11 h-11 rounded-2xl bg-white items-center justify-center">
                    <Banknote size={19} color="#159A64" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-[#132F57] text-xs font-extrabold">
                      Request withdrawal
                    </Text>

                    <Text className="mt-1 text-[#64748B] text-[10px]">
                      Withdraw available earnings
                    </Text>
                  </View>

                  <ArrowRight size={16} color="#159A64" />
                </Pressable>

                <Pressable
                  onPress={() => router.push("/provider/earnings")}
                  className="mt-3 rounded-[20px] bg-[#EEF4FF] border border-[#DCE7FF] p-4 flex-row items-center active:opacity-70"
                >
                  <View className="w-11 h-11 rounded-2xl bg-white items-center justify-center">
                    <CircleDollarSign size={19} color="#3563E9" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-[#132F57] text-xs font-extrabold">
                      Earnings overview
                    </Text>

                    <Text className="mt-1 text-[#64748B] text-[10px]">
                      Review jobs and income
                    </Text>
                  </View>

                  <ArrowRight size={16} color="#3563E9" />
                </Pressable>
              </View>

              {/* INFO CARD */}
              <View className="mt-4 rounded-[26px] bg-[#102A4C] p-5">
                <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                  <CreditCard size={19} color="#6EE7B7" />
                </View>

                <Text className="mt-4 text-white text-base font-extrabold">
                  How your wallet works
                </Text>

                <Text className="mt-2 text-white/60 text-xs leading-5">
                  Online earnings can credit your wallet, while withdrawals and
                  applicable commission adjustments reduce the balance.
                </Text>

                <View className="mt-4 rounded-2xl bg-white/10 p-3">
                  <View className="flex-row items-center">
                    <ShieldCheck size={14} color="#6EE7B7" />

                    <Text className="ml-2 text-white/75 text-[10px] font-semibold flex-1">
                      Every transaction stores both the previous and resulting
                      balance for easier tracking.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
