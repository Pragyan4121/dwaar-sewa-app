import axios from "axios";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Landmark,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
  XCircle,
} from "lucide-react-native";

import {
  createProviderWithdrawal,
  getProviderEarningsSummary,
  getProviderWithdrawals,
} from "@/api/provider-earnings";

import type { ProviderWithdrawal, ProviderWalletSummary } from "@/types";

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

function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
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
      onPress: onConfirm,
    },
  ]);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "approved":
    case "completed":
    case "paid":
      return {
        container: "bg-[#EAF8F1]",
        text: "text-[#159A64]",
        border: "border-[#CDEBD9]",
      };

    case "rejected":
    case "cancelled":
      return {
        container: "bg-[#FFF1F2]",
        text: "text-[#DC2626]",
        border: "border-[#FECDD3]",
      };

    case "processing":
      return {
        container: "bg-[#EEF4FF]",
        text: "text-[#3563E9]",
        border: "border-[#D8E4FF]",
      };

    default:
      return {
        container: "bg-[#FFF7E6]",
        text: "text-[#B7791F]",
        border: "border-[#FDE7B1]",
      };
  }
}

export default function ProviderWithdrawalsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [wallet, setWallet] = useState<ProviderWalletSummary | null>(null);

  const [withdrawals, setWithdrawals] = useState<ProviderWithdrawal[]>([]);

  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [providerNote, setProviderNote] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const [summaryResult, withdrawalsResult] = await Promise.all([
        getProviderEarningsSummary(),
        getProviderWithdrawals(1, 50),
      ]);

      setWallet(summaryResult.wallet);
      setWithdrawals(withdrawalsResult.withdrawals);
    } catch (error) {
      console.error("Load provider withdrawals error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ??
            "Unable to load withdrawal information.",
        );
      } else {
        setErrorMessage("Unable to load withdrawal information.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function validateForm(): number | null {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Enter a valid withdrawal amount.");

      return null;
    }

    if (wallet && parsedAmount > Number(wallet.balance)) {
      setErrorMessage("Withdrawal amount cannot exceed your wallet balance.");

      return null;
    }

    if (!accountName.trim()) {
      setErrorMessage("Account holder name is required.");

      return null;
    }

    if (!accountNumber.trim()) {
      setErrorMessage("Account number is required.");

      return null;
    }

    if (!bankName.trim()) {
      setErrorMessage("Bank name is required.");

      return null;
    }

    return Math.round(parsedAmount * 100) / 100;
  }

  function handleSubmitConfirmation() {
    if (isSubmitting) {
      return;
    }

    const parsedAmount = validateForm();

    if (parsedAmount === null) {
      return;
    }

    confirmAction(
      "Confirm withdrawal",
      `Request withdrawal of ${formatMoney(
        parsedAmount,
      )} to ${bankName.trim()}?`,
      "Submit",
      () => {
        void performWithdrawal(parsedAmount);
      },
    );
  }

  async function performWithdrawal(parsedAmount: number) {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createProviderWithdrawal({
        amount: parsedAmount,
        paymentMethod: "bank_transfer",
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        providerNote: providerNote.trim() || undefined,
      });

      setSuccessMessage("Withdrawal request submitted successfully.");

      setAmount("");
      setProviderNote("");

      await loadData(true);
    } catch (error) {
      console.error("Create provider withdrawal error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ??
            "Unable to submit withdrawal request.",
        );
      } else {
        setErrorMessage("Unable to submit withdrawal request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading withdrawals...
        </Text>
      </SafeAreaView>
    );
  }

  const walletBalance = Number(wallet?.balance ?? 0);

  const hasPositiveBalance = walletBalance > 0;

  const walletIsNegative = walletBalance < 0;

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
                void loadData(true);
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
                  onPress={() => router.back()}
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
                  PROVIDER PAYOUTS
                </Text>

                <Text
                  className={`mt-1 font-extrabold text-[#132F57] ${
                    isTablet ? "text-[30px]" : "text-[26px]"
                  }`}
                >
                  Withdraw earnings
                </Text>

                <Text className="mt-1 text-sm text-[#64748B]">
                  Request a transfer from your provider wallet to your bank
                  account.
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
                        WALLET BALANCE
                      </Text>
                    </View>

                    <Text className="mt-4 text-xs font-semibold text-white/60">
                      {walletIsNegative
                        ? "You Owe Dwaar Sewa"
                        : "Available Balance"}
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
                    <View className="bg-white/10 rounded-[20px] p-4">
                      <Text className="text-white text-xs font-bold">
                        {walletIsNegative
                          ? "Commission balance due"
                          : hasPositiveBalance
                            ? "Ready to request payout"
                            : "No withdrawable balance"}
                      </Text>

                      <Text className="mt-1 text-[10px] leading-5 text-white/65">
                        {walletIsNegative
                          ? "This amount is commission from cash bookings and will automatically settle from future online-paid earnings."
                          : hasPositiveBalance
                            ? "You can submit a bank-transfer withdrawal request using the form below."
                            : "Complete eligible jobs to build a positive provider wallet balance."}
                      </Text>
                    </View>
                  </View>
                </View>
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

                  <Pressable
                    onPress={() => setSuccessMessage("")}
                    className="w-8 h-8 rounded-xl bg-white items-center justify-center"
                  >
                    <X size={14} color="#159A64" />
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View
              className={
                isDesktop ? "flex-row px-5 mt-5 gap-5 items-start" : "px-5 mt-5"
              }
            >
              {/* REQUEST FORM */}
              <View
                style={{
                  flex: isDesktop ? 1 : undefined,
                }}
              >
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                      <Banknote size={19} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-lg font-extrabold">
                        New withdrawal request
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Bank transfer payout
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                      Withdrawal amount
                    </Text>

                    <View className="relative">
                      <TextInput
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 pr-16 text-[#132F57] text-base"
                        value={amount}
                        onChangeText={(value) => {
                          setAmount(value.replace(/[^0-9.]/g, ""));
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        placeholder="Enter amount"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                      />

                      <View className="absolute right-4 top-0 bottom-0 justify-center">
                        <Text className="text-[#94A3B8] text-xs font-bold">
                          NPR
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-[#64748B] text-[10px]">
                        Available: {formatMoney(Math.max(walletBalance, 0))}
                      </Text>

                      <Pressable
                        className={`rounded-xl px-3 py-2 ${
                          hasPositiveBalance
                            ? "bg-[#EAF8F1] active:opacity-70"
                            : "bg-[#F2F4F7]"
                        }`}
                        onPress={() => {
                          setAmount(String(Math.max(walletBalance, 0)));
                          setErrorMessage("");
                        }}
                        disabled={isSubmitting || !hasPositiveBalance}
                      >
                        <Text
                          className={`text-[10px] font-extrabold ${
                            hasPositiveBalance
                              ? "text-[#159A64]"
                              : "text-[#94A3B8]"
                          }`}
                        >
                          Use full balance
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View className="h-px bg-[#EEF2F6] my-5" />

                  <View className="flex-row items-center mb-4">
                    <View className="w-9 h-9 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <Landmark size={16} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Bank details
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Where your payout should be sent
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                    Account holder name
                  </Text>

                  <TextInput
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-[#132F57] text-sm mb-3"
                    value={accountName}
                    onChangeText={(value) => {
                      setAccountName(value);
                      setErrorMessage("");
                    }}
                    placeholder="Enter account holder name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />

                  <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                    Account number
                  </Text>

                  <TextInput
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-[#132F57] text-sm mb-3"
                    value={accountNumber}
                    onChangeText={(value) => {
                      setAccountNumber(value);
                      setErrorMessage("");
                    }}
                    placeholder="Enter account number"
                    placeholderTextColor="#94A3B8"
                    editable={!isSubmitting}
                  />

                  <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                    Bank name
                  </Text>

                  <TextInput
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-[#132F57] text-sm mb-3"
                    value={bankName}
                    onChangeText={(value) => {
                      setBankName(value);
                      setErrorMessage("");
                    }}
                    placeholder="Enter bank name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />

                  <Text className="text-[#132F57] text-xs font-semibold mb-1.5">
                    Note{" "}
                    <Text className="text-[#94A3B8] font-medium">
                      (optional)
                    </Text>
                  </Text>

                  <TextInput
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-4 text-[#132F57] text-sm min-h-[100px]"
                    value={providerNote}
                    onChangeText={setProviderNote}
                    placeholder="Add a note for the administrator"
                    placeholderTextColor="#94A3B8"
                    multiline
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />

                  <Pressable
                    className={`mt-5 rounded-2xl py-4 items-center flex-row justify-center ${
                      hasPositiveBalance
                        ? "bg-[#159A64] active:opacity-80"
                        : "bg-[#CBD5E1]"
                    }`}
                    onPress={handleSubmitConfirmation}
                    disabled={isSubmitting || !hasPositiveBalance}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#FFFFFF" />

                        <Text className="ml-2 text-white font-bold text-sm">
                          Submit withdrawal request
                        </Text>
                      </>
                    )}
                  </Pressable>

                  {!hasPositiveBalance ? (
                    <View className="mt-3 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-3 flex-row items-start">
                      <ShieldCheck size={16} color="#64748B" />

                      <Text className="flex-1 ml-2 text-[#64748B] text-[10px] leading-5">
                        {walletIsNegative
                          ? `You owe Dwaar Sewa ${formatMoney(
                              Math.abs(walletBalance),
                            )} in cash-booking commission. This must clear before you can withdraw.`
                          : "You need a positive wallet balance before requesting a withdrawal."}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* SIDE INFO */}
              <View
                style={{
                  width: isDesktop ? 360 : "100%",
                  marginTop: isDesktop ? 0 : 16,
                }}
              >
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-2xl bg-[#FFF7E6] items-center justify-center">
                      <Building2 size={18} color="#B7791F" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-sm font-extrabold">
                        Before you submit
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Review your bank details carefully
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    {[
                      "Withdrawal requests are submitted by bank transfer.",
                      "The amount cannot exceed your available wallet balance.",
                      "Check the account holder, account number and bank name before submitting.",
                      "You can track approval or processing status in the history below.",
                    ].map((item) => (
                      <View key={item} className="flex-row items-start mb-3">
                        <View className="w-5 h-5 rounded-full bg-[#EAF8F1] items-center justify-center mt-0.5">
                          <CheckCircle2 size={11} color="#159A64" />
                        </View>

                        <Text className="flex-1 ml-2 text-[#64748B] text-[11px] leading-5">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                  <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                    <CreditCard size={20} color="#5DD39E" />
                  </View>

                  <Text className="text-white text-base font-extrabold mt-4">
                    Secure payout request
                  </Text>

                  <Text className="text-white/65 text-xs leading-5 mt-1">
                    Your withdrawal request is recorded first and processed
                    through the provider payout workflow.
                  </Text>
                </View>
              </View>
            </View>

            {/* HISTORY */}
            <View className="px-5 mt-7">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-[#F5F7FA] items-center justify-center">
                  <History size={18} color="#64748B" />
                </View>

                <View className="ml-3">
                  <Text className="text-[#132F57] text-xl font-extrabold">
                    Withdrawal history
                  </Text>

                  <Text className="text-[#64748B] text-xs mt-0.5">
                    {withdrawals.length}{" "}
                    {withdrawals.length === 1 ? "request" : "requests"}
                  </Text>
                </View>
              </View>

              {withdrawals.length === 0 ? (
                <View className="mt-4 items-center rounded-[26px] border border-[#E7ECF2] bg-white px-6 py-12">
                  <View className="w-16 h-16 rounded-[22px] bg-[#F5F7FA] items-center justify-center">
                    <WalletCards size={26} color="#94A3B8" />
                  </View>

                  <Text className="mt-4 text-lg font-extrabold text-[#132F57]">
                    No withdrawals yet
                  </Text>

                  <Text className="mt-2 text-center text-xs leading-5 text-[#64748B] max-w-[280px]">
                    Your withdrawal requests will appear here.
                  </Text>
                </View>
              ) : (
                <View
                  className={
                    isDesktop ? "flex-row flex-wrap gap-4 mt-4" : "mt-4"
                  }
                >
                  {withdrawals.map((withdrawal) => {
                    const statusStyle = getStatusClasses(withdrawal.status);

                    return (
                      <View
                        key={withdrawal.id}
                        className="rounded-[24px] border border-[#E7ECF2] bg-white p-5 mb-4"
                        style={{
                          width: isDesktop ? "48.9%" : "100%",
                        }}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="text-[10px] font-extrabold tracking-wide text-[#94A3B8]">
                              REQUEST #{withdrawal.id}
                            </Text>

                            <Text className="mt-1 text-xl font-extrabold text-[#132F57]">
                              {formatMoney(withdrawal.amount)}
                            </Text>
                          </View>

                          <View
                            className={`rounded-full border px-2.5 py-1 ${statusStyle.container} ${statusStyle.border}`}
                          >
                            <Text
                              className={`text-[9px] font-extrabold ${statusStyle.text}`}
                            >
                              {formatText(withdrawal.status)}
                            </Text>
                          </View>
                        </View>

                        <View className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">Bank</Text>

                            <Text className="text-[#132F57] text-xs font-bold text-right ml-3">
                              {withdrawal.bank_name ?? "Not available"}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row items-center justify-between">
                            <Text className="text-[#64748B] text-xs">
                              Account
                            </Text>

                            <Text className="text-[#132F57] text-xs font-bold text-right ml-3">
                              {withdrawal.account_number ?? "Not available"}
                            </Text>
                          </View>

                          <View className="mt-3 flex-row items-start justify-between">
                            <Text className="text-[#64748B] text-xs">
                              Requested
                            </Text>

                            <Text className="text-[#132F57] text-xs font-bold text-right ml-3">
                              {formatDateTime(
                                withdrawal.requested_at ??
                                  withdrawal.created_at,
                              )}
                            </Text>
                          </View>
                        </View>

                        {withdrawal.admin_note ? (
                          <View className="mt-3 rounded-2xl border border-[#E7ECF2] bg-white p-4">
                            <View className="flex-row items-center">
                              <Clock3 size={14} color="#64748B" />

                              <Text className="ml-2 text-[10px] font-extrabold tracking-wide text-[#64748B]">
                                ADMIN NOTE
                              </Text>
                            </View>

                            <Text className="mt-2 text-xs leading-5 text-[#475569]">
                              {withdrawal.admin_note}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
