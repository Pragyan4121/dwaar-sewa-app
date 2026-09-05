import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";

import {
  requestCustomerPasswordReset,
  verifyCustomerPasswordResetOtp,
} from "@/api/customer-auth";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  retry_after_seconds?: number;
}

const DEFAULT_RESEND_SECONDS = 60;

export default function CustomerVerifyResetOtpScreen() {
  const params = useLocalSearchParams<{
    email?: string | string[];
    resendSeconds?: string | string[];
  }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const email =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  const initialResendSeconds =
    typeof params.resendSeconds === "string"
      ? Number(params.resendSeconds)
      : DEFAULT_RESEND_SECONDS;

  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);

  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [resendSeconds, setResendSeconds] = useState(
    Number.isInteger(initialResendSeconds) && initialResendSeconds > 0
      ? initialResendSeconds
      : DEFAULT_RESEND_SECONDS,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

  function formatEmail(value: string): string {
    const [localPart, domain] = value.split("@");

    if (!localPart || !domain) {
      return value;
    }

    if (localPart.length <= 2) {
      return `${localPart.charAt(0)}***@${domain}`;
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  function handleCodeChange(value: string) {
    const numericCode = value.replace(/\D/g, "").slice(0, 6);

    setCode(numericCode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleVerify() {
    if (isVerifying || isResending) {
      return;
    }

    if (!email) {
      setErrorMessage(
        "Customer email is missing. Please request a new reset code.",
      );

      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Enter the complete six-digit reset code.");

      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await verifyCustomerPasswordResetOtp({
        email,
        code,
      });

      if (!result.reset_token) {
        setErrorMessage(
          "Password reset token was not returned. Please try again.",
        );

        return;
      }

      setSuccessMessage("Reset code verified successfully.");

      setTimeout(() => {
        router.replace({
          pathname: "/auth/reset-password",
          params: {
            resetToken: result.reset_token,
            email,
          },
        });
      }, 700);
    } catch (error) {
      console.error("Verify customer password reset OTP error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to verify the reset code.",
        );

        return;
      }

      setErrorMessage("Something went wrong while verifying the reset code.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (isResending || isVerifying || resendSeconds > 0) {
      return;
    }

    if (!email) {
      setErrorMessage(
        "Customer email is missing. Please return and enter your email again.",
      );

      return;
    }

    try {
      setIsResending(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await requestCustomerPasswordReset(email);

      setCode("");

      setResendSeconds(
        result.otp_resend_after_seconds ?? DEFAULT_RESEND_SECONDS,
      );

      setSuccessMessage("A new password reset code has been sent.");

      inputRef.current?.focus();
    } catch (error) {
      console.error("Resend customer password reset OTP error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        if (
          error.response?.status === 429 &&
          responseData?.retry_after_seconds
        ) {
          setResendSeconds(responseData.retry_after_seconds);
        }

        setErrorMessage(
          responseData?.message ?? "Unable to resend the reset code.",
        );

        return;
      }

      setErrorMessage("Something went wrong while resending the reset code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
              flex: 1,
            }}
            className={isDesktop ? "flex-row gap-5 px-5 py-5" : "px-5 py-5"}
          >
            {/* LEFT PANEL */}
            <View
              className="overflow-hidden rounded-[30px] bg-[#132F57]"
              style={{
                flex: isDesktop ? 1 : undefined,
                minHeight: isDesktop ? 640 : undefined,
              }}
            >
              <View className="flex-1 justify-between p-6">
                <View>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:opacity-70"
                    onPress={() => router.back()}
                    disabled={isVerifying || isResending}
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#FF5A3C]">
                    <KeyRound size={28} color="#FFFFFF" />
                  </View>

                  <Text
                    className={`mt-6 font-extrabold text-white ${
                      isTablet
                        ? "text-[34px] leading-[42px]"
                        : "text-[28px] leading-9"
                    }`}
                  >
                    Verify your reset code
                  </Text>

                  <Text className="mt-3 max-w-[470px] text-sm leading-6 text-white/65">
                    Enter the six-digit code sent to your customer email to
                    continue securely.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: MailCheck,
                      title: "Check your email",
                      text: "Use the latest six-digit reset code sent to your account.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure one-time code",
                      text: "The reset code expires after a short period and can only be used once.",
                    },
                    {
                      icon: KeyRound,
                      title: "Create a new password",
                      text: "After verification, you can safely set a new account password.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <View
                        key={item.title}
                        className="mb-3 flex-row items-start rounded-[20px] bg-white/10 p-4"
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <Icon size={18} color="#FFB199" />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text className="text-xs font-extrabold text-white">
                            {item.title}
                          </Text>

                          <Text className="mt-1 text-[10px] leading-5 text-white/60">
                            {item.text}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* OTP PANEL */}
            <View
              className={isDesktop ? "justify-center" : "mt-5"}
              style={{
                width: isDesktop ? 470 : "100%",
              }}
            >
              <View className="rounded-[30px] border border-[#E7ECF2] bg-white p-6">
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3EE]">
                    <BadgeCheck size={20} color="#FF5A3C" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[10px] font-extrabold tracking-[1.1px] text-[#FF5A3C]">
                      OTP VERIFICATION
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Verify reset code
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Enter the six-digit code sent to{" "}
                  <Text className="font-bold text-[#132F57]">
                    {email ? formatEmail(email) : "your email"}
                  </Text>
                  .
                </Text>

                {errorMessage ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                    <XCircle size={17} color="#BE123C" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                      {errorMessage}
                    </Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View className="mt-5 flex-row items-center rounded-[18px] border border-[#CDEBD9] bg-[#EAF8F1] p-4">
                    <CheckCircle2 size={17} color="#159A64" />

                    <Text className="ml-2 flex-1 text-xs font-semibold text-[#159A64]">
                      {successMessage}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-6">
                  <Text className="mb-2 text-xs font-semibold text-[#132F57]">
                    Reset code
                  </Text>

                  <View
                    className={`rounded-[22px] border px-4 py-4 ${
                      code.length === 6
                        ? "border-[#FFD2C7] bg-[#FFF8F5]"
                        : "border-[#E2E8F0] bg-[#FAFBFC]"
                    }`}
                  >
                    <TextInput
                      ref={inputRef}
                      className="h-14 text-center text-[30px] font-extrabold tracking-[10px] text-[#132F57]"
                      value={code}
                      onChangeText={handleCodeChange}
                      placeholder="000000"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isVerifying && !isResending}
                      returnKeyType="done"
                      onSubmitEditing={handleVerify}
                    />
                  </View>

                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-[10px] text-[#94A3B8]">
                      Six digits required
                    </Text>

                    <Text
                      className={`text-[10px] font-bold ${
                        code.length === 6 ? "text-[#FF5A3C]" : "text-[#94A3B8]"
                      }`}
                    >
                      {code.length}/6
                    </Text>
                  </View>
                </View>

                <Pressable
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    isVerifying || code.length !== 6
                      ? "bg-[#FFB09E]"
                      : "bg-[#FF5A3C] active:opacity-80"
                  }`}
                  onPress={handleVerify}
                  disabled={isVerifying || isResending || code.length !== 6}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <BadgeCheck size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Verify Reset Code
                      </Text>
                    </>
                  )}
                </Pressable>

                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <Text className="text-xs font-bold text-[#132F57]">
                    Didn&apos;t receive the code?
                  </Text>

                  <Text className="mt-1 text-[10px] leading-5 text-[#64748B]">
                    You can request another code when the resend timer reaches
                    zero.
                  </Text>

                  <Pressable
                    className={`mt-3 flex-row items-center justify-center rounded-2xl border py-3.5 ${
                      resendSeconds > 0
                        ? "border-[#E2E8F0] bg-white"
                        : "border-[#FF5A3C] bg-white active:opacity-70"
                    }`}
                    onPress={handleResend}
                    disabled={isResending || isVerifying || resendSeconds > 0}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color="#FF5A3C" />
                    ) : (
                      <>
                        <RefreshCw
                          size={15}
                          color={resendSeconds > 0 ? "#94A3B8" : "#FF5A3C"}
                        />

                        <Text
                          className={`ml-2 text-xs font-bold ${
                            resendSeconds > 0
                              ? "text-[#94A3B8]"
                              : "text-[#FF5A3C]"
                          }`}
                        >
                          {resendSeconds > 0
                            ? `Resend in ${resendSeconds}s`
                            : "Resend reset code"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View className="mt-4 flex-row items-start rounded-[18px] border border-[#FDE7B1] bg-[#FFF7E6] p-4">
                  <ShieldCheck size={16} color="#B7791F" />

                  <Text className="ml-2 flex-1 text-[10px] leading-5 text-[#92400E]">
                    After successful verification, you&apos;ll create a new
                    password for your Dwaar Sewa customer account.
                  </Text>
                </View>

                <Pressable
                  className="mt-4 items-center rounded-2xl border border-[#E2E8F0] bg-white py-3.5 active:opacity-70"
                  onPress={() => router.replace("/auth/login")}
                  disabled={isVerifying || isResending}
                >
                  <Text className="text-xs font-bold text-[#475569]">
                    Return to Login
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure one-time verification
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
