import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import {
  ArrowDownLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  History,
  Receipt,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react-native";

import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { ErrorState } from "@/components/ErrorState";
import { SignInPrompt } from "@/components/SignInPrompt";

import type { Wallet } from "@/types";

type CustomerWalletSummary = {
  currency: string;
  total_paid: string;
  total_refunded: string;
  net_spent: string;
  successful_payment_count: number;
  refunded_payment_count: number;
  payment_record_count: number;
};

type CustomerPayment = {
  id: number;
  booking_id: number;
  amount: string;
  payment_method: string;
  payment_status: string;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  booking: {
    id: number;
    status: string;
    final_price: string | null;
    created_at: string | null;

    service: {
      id: number;
      name: string;
    };
  };
};

type WalletResponse = {
  message: string;

  wallet: Wallet & {
    available_balance?: string;
    amount_owed_to_platform?: string;
  };

  summary?: CustomerWalletSummary;
  payments?: CustomerPayment[];
};

function formatMoney(
  value: string | number | null | undefined,
  currency = "NPR",
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPaymentMethod(method: string) {
  const normalized = method.toLowerCase();

  if (normalized === "esewa") {
    return "eSewa";
  }

  if (normalized === "khalti") {
    return "Khalti";
  }

  if (normalized === "connectips") {
    return "ConnectIPS";
  }

  if (normalized === "cash") {
    return "Cash";
  }

  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPaymentStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function WalletScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletResponse["wallet"] | null>(null);
  const [summary, setSummary] = useState<CustomerWalletSummary | null>(null);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(
    async (refresh = false) => {
      if (!isAuthenticated) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const { data } = await api.get<WalletResponse>("/wallets/me");

        setWallet(data.wallet);
        setSummary(data.summary ?? null);
        setPayments(data.payments ?? []);
      } catch (err) {
        console.error("Load customer wallet error:", err);

        setError("Couldn't load your payment history.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet]),
  );

  /*
  |--------------------------------------------------------------------------
  | Signed-out state
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to view payments"
        message="Track how much you've spent, view refunds and review your complete payment history."
      />
    );
  }

  const currency = summary?.currency ?? wallet?.currency ?? "NPR";

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadWallet(true);
            }}
            tintColor="#FF5A3C"
          />
        }
        contentContainerStyle={{
          paddingBottom: 70,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1000,
            alignSelf: "center",
          }}
        >
          {/* HEADER */}

          <View className="px-5 pt-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-[#132F57] text-[28px] font-extrabold">
                  Payments
                </Text>

                <Text className="mt-1 text-[#64748B] text-sm leading-5">
                  Track your spending, refunds and service payments.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  void loadWallet(true);
                }}
                disabled={refreshing}
                className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#FF5A3C" />
                ) : (
                  <RefreshCcw size={18} color="#132F57" />
                )}
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View className="items-center justify-center px-5 py-24">
              <View className="w-[72px] h-[72px] rounded-[26px] bg-white border border-[#E7ECF2] items-center justify-center">
                <ActivityIndicator size="small" color="#FF5A3C" />
              </View>

              <Text className="mt-4 text-[#132F57] text-sm font-bold">
                Loading payments
              </Text>

              <Text className="mt-1 text-[#94A3B8] text-xs">
                Getting your latest payment activity...
              </Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View className="px-5 mt-8">
              <ErrorState message={error} onRetry={() => void loadWallet()} />
            </View>
          ) : null}

          {!loading && !error ? (
            <>
              {/* NET SPENT HERO */}

              <View className="px-5 mt-6">
                <View className="rounded-[30px] bg-[#132F57] p-5 overflow-hidden">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="self-start flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                        <WalletCards size={13} color="#FFFFFF" />

                        <Text className="ml-1.5 text-white text-[10px] font-extrabold tracking-wide">
                          YOUR SPENDING
                        </Text>
                      </View>

                      <Text className="mt-5 text-white/60 text-xs font-semibold">
                        Net amount spent
                      </Text>

                      <Text className="mt-1 text-white text-[32px] font-extrabold">
                        {formatMoney(summary?.net_spent ?? 0, currency)}
                      </Text>

                      <Text className="mt-2 text-white/50 text-[10px] leading-5 max-w-[360px]">
                        This is the amount you've actually spent after completed
                        refunds are deducted.
                      </Text>
                    </View>

                    <View className="w-14 h-14 rounded-[20px] bg-white/10 items-center justify-center">
                      <CircleDollarSign size={25} color="#FFFFFF" />
                    </View>
                  </View>

                  <View className="mt-5 h-px bg-white/10" />

                  <View className="mt-5 flex-row">
                    <View className="flex-1 pr-3">
                      <Text className="text-white/45 text-[9px] font-bold tracking-wide">
                        PAYMENTS
                      </Text>

                      <Text className="mt-1 text-white text-base font-extrabold">
                        {summary?.successful_payment_count ?? 0}
                      </Text>
                    </View>

                    <View className="w-px bg-white/10" />

                    <View className="flex-1 pl-4">
                      <Text className="text-white/45 text-[9px] font-bold tracking-wide">
                        REFUNDS
                      </Text>

                      <Text className="mt-1 text-white text-base font-extrabold">
                        {summary?.refunded_payment_count ?? 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* SUMMARY CARDS */}

              <View className="px-5 mt-4 flex-row">
                <View className="flex-1 mr-2 rounded-[24px] bg-white border border-[#E7ECF2] p-4">
                  <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                    <CreditCard size={18} color="#3563E9" />
                  </View>

                  <Text className="mt-4 text-[#94A3B8] text-[9px] font-bold tracking-wide">
                    TOTAL PAID
                  </Text>

                  <Text
                    className="mt-1 text-[#132F57] text-base font-extrabold"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary?.total_paid ?? 0, currency)}
                  </Text>
                </View>

                <View className="flex-1 ml-2 rounded-[24px] bg-white border border-[#E7ECF2] p-4">
                  <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                    <RotateCcw size={18} color="#FF5A3C" />
                  </View>

                  <Text className="mt-4 text-[#94A3B8] text-[9px] font-bold tracking-wide">
                    REFUNDED
                  </Text>

                  <Text
                    className="mt-1 text-[#132F57] text-base font-extrabold"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary?.total_refunded ?? 0, currency)}
                  </Text>
                </View>
              </View>

              {/* EXPLANATION */}

              <View className="px-5 mt-4">
                <View className="rounded-[22px] bg-[#FFF8F5] border border-[#FFE3DA] p-4">
                  <View className="flex-row items-start">
                    <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
                      <ShieldCheck size={17} color="#FF5A3C" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-[#132F57] text-xs font-extrabold">
                        Spending is refund-adjusted
                      </Text>

                      <Text className="mt-1 text-[#64748B] text-[10px] leading-5">
                        When a completed payment is fully refunded, that amount
                        is removed from your net spending total automatically.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* PAYMENT HISTORY HEADER */}

              <View className="px-5 mt-7">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <History size={18} color="#132F57" />

                    <Text className="ml-2 text-[#132F57] text-base font-extrabold">
                      Payment history
                    </Text>
                  </View>

                  <Text className="text-[#94A3B8] text-[10px] font-bold">
                    {summary?.payment_record_count ?? payments.length} records
                  </Text>
                </View>
              </View>

              {/* EMPTY HISTORY */}

              {payments.length === 0 ? (
                <View className="px-5 mt-4">
                  <View className="rounded-[28px] bg-white border border-[#E7ECF2] px-6 py-12 items-center">
                    <View className="w-16 h-16 rounded-[24px] bg-[#F5F7FA] items-center justify-center">
                      <Receipt size={25} color="#94A3B8" />
                    </View>

                    <Text className="mt-4 text-[#132F57] text-base font-extrabold">
                      No payments yet
                    </Text>

                    <Text className="mt-2 max-w-[300px] text-center text-[#64748B] text-xs leading-5">
                      Completed payments and refunds for your service bookings
                      will appear here.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* PAYMENT HISTORY */}

              {payments.length > 0 ? (
                <View className="px-5 mt-4">
                  {payments.map((payment) => {
                    const isPaid = payment.payment_status === "paid";
                    const isRefunded = payment.payment_status === "refunded";
                    const isPending = payment.payment_status === "pending";

                    const statusColor = isPaid
                      ? "#159A64"
                      : isRefunded
                        ? "#FF5A3C"
                        : "#B7791F";

                    const statusBackground = isPaid
                      ? "#EAF8F1"
                      : isRefunded
                        ? "#FFF3EE"
                        : "#FFF7E6";

                    return (
                      <Pressable
                        key={payment.id}
                        onPress={() =>
                          router.push(`/booking/${payment.booking_id}`)
                        }
                        className="mb-3 rounded-[26px] bg-white border border-[#E7ECF2] overflow-hidden active:opacity-80"
                      >
                        <View className="p-4">
                          <View className="flex-row items-start">
                            <View
                              className="w-12 h-12 rounded-[18px] items-center justify-center"
                              style={{
                                backgroundColor: statusBackground,
                              }}
                            >
                              {isRefunded ? (
                                <ArrowDownLeft size={20} color={statusColor} />
                              ) : isPaid ? (
                                <CheckCircle2 size={20} color={statusColor} />
                              ) : (
                                <CreditCard size={20} color={statusColor} />
                              )}
                            </View>

                            <View className="ml-3 flex-1">
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1 pr-3">
                                  <Text
                                    className="text-[#132F57] text-sm font-extrabold"
                                    numberOfLines={2}
                                  >
                                    {payment.booking.service.name}
                                  </Text>

                                  <Text className="mt-1 text-[#94A3B8] text-[10px]">
                                    Booking #{payment.booking_id}
                                  </Text>
                                </View>

                                <View className="items-end">
                                  <Text
                                    className="text-sm font-extrabold"
                                    style={{
                                      color: isRefunded ? "#FF5A3C" : "#132F57",
                                    }}
                                  >
                                    {isRefunded ? "- " : ""}
                                    {formatMoney(payment.amount, currency)}
                                  </Text>

                                  <View
                                    className="mt-2 rounded-full px-2.5 py-1"
                                    style={{
                                      backgroundColor: statusBackground,
                                    }}
                                  >
                                    <Text
                                      className="text-[9px] font-extrabold"
                                      style={{
                                        color: statusColor,
                                      }}
                                    >
                                      {formatPaymentStatus(
                                        payment.payment_status,
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <View className="mt-4 h-px bg-[#F0F3F6]" />

                              <View className="mt-3 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                  {payment.payment_method === "cash" ? (
                                    <Banknote size={13} color="#64748B" />
                                  ) : (
                                    <CreditCard size={13} color="#64748B" />
                                  )}

                                  <Text className="ml-1.5 text-[#64748B] text-[10px] font-semibold">
                                    {formatPaymentMethod(
                                      payment.payment_method,
                                    )}
                                  </Text>

                                  <View className="mx-2 w-1 h-1 rounded-full bg-[#CBD5E1]" />

                                  <CalendarDays size={12} color="#94A3B8" />

                                  <Text className="ml-1 text-[#94A3B8] text-[10px]">
                                    {formatDate(
                                      payment.paid_at ?? payment.created_at,
                                    )}
                                  </Text>
                                </View>

                                <ChevronRight size={16} color="#94A3B8" />
                              </View>

                              {payment.transaction_reference ? (
                                <Text
                                  className="mt-2 text-[#94A3B8] text-[9px]"
                                  numberOfLines={1}
                                >
                                  Ref: {payment.transaction_reference}
                                </Text>
                              ) : null}

                              {isPending ? (
                                <View className="mt-3 rounded-xl bg-[#FFF7E6] px-3 py-2.5">
                                  <Text className="text-[#92400E] text-[10px] leading-4">
                                    This payment is still pending and is not
                                    included in your spending total.
                                  </Text>
                                </View>
                              ) : null}

                              {isRefunded ? (
                                <View className="mt-3 rounded-xl bg-[#FFF3EE] px-3 py-2.5">
                                  <Text className="text-[#C2410C] text-[10px] leading-4">
                                    This payment was refunded and has been
                                    removed from your net spending.
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
