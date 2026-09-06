import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { safeBack } from "@/utils/navigation";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  CheckCircle2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react-native";

import {
  resendProviderVerificationOtp,
  verifyProviderEmail,
} from "@/api/provider-auth";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  retry_after_seconds?: number;
}

const DEFAULT_RESEND_SECONDS = 60;

export default function ProviderVerifyEmailScreen() {
  const params = useLocalSearchParams<{
    email?: string | string[];
  }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const email =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [resendSeconds, setResendSeconds] = useState(DEFAULT_RESEND_SECONDS);

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
      setErrorMessage("Provider email is missing. Please register again.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Enter the complete six-digit verification code.");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage("");
      setSuccessMessage("");

      await verifyProviderEmail({
        email,
        code,
      });

      setSuccessMessage("Your email has been verified successfully.");

      setTimeout(() => {
        router.replace({
          pathname: "/provider/login",
          params: {
            verified: "true",
            email,
          },
        });
      }, 900);
    } catch (error) {
      console.error("Verify provider email error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "Unable to verify the code.",
        );
        return;
      }

      setErrorMessage("Something went wrong while verifying your email.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (isResending || isVerifying || resendSeconds > 0) {
      return;
    }

    if (!email) {
      setErrorMessage("Provider email is missing. Please register again.");
      return;
    }

    try {
      setIsResending(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await resendProviderVerificationOtp(email);

      setCode("");
      setResendSeconds(
        result.otp_resend_after_seconds ?? DEFAULT_RESEND_SECONDS,
      );

      setSuccessMessage("A new verification code has been sent.");

      inputRef.current?.focus();
    } catch (error) {
      console.error("Resend provider verification OTP error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        if (
          error.response?.status === 429 &&
          responseData?.retry_after_seconds
        ) {
          setResendSeconds(responseData.retry_after_seconds);
        }

        setErrorMessage(
          responseData?.message ?? "Unable to resend the verification code.",
        );

        return;
      }

      setErrorMessage("Something went wrong while resending the code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
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
            {/* BRAND PANEL */}
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
                    onPress={() => safeBack(router, "/provider/login")}
                    disabled={isVerifying || isResending}
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#159A64]">
                    <MailCheck size={28} color="#FFFFFF" />
                  </View>

                  <Text
                    className={`mt-6 font-extrabold text-white ${
                      isTablet
                        ? "text-[34px] leading-[42px]"
                        : "text-[28px] leading-9"
                    }`}
                  >
                    Verify your provider email
                  </Text>

                  <Text className="mt-3 max-w-[470px] text-sm leading-6 text-white/65">
                    Enter the six-digit code sent to your registered email to
                    activate email verification for your provider account.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: MailCheck,
                      title: "Check your inbox",
                      text: "Use the latest six-digit verification code we sent to your provider email.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure account verification",
                      text: "Email verification helps protect your provider account and recovery flow.",
                    },
                    {
                      icon: Sparkles,
                      title: "Continue to approval",
                      text: "After email verification, your provider profile remains pending for administrator approval.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <View
                        key={item.title}
                        className="mb-3 flex-row items-start rounded-[20px] bg-white/10 p-4"
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <Icon size={18} color="#5DD39E" />
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

            {/* VERIFICATION PANEL */}
            <View
              className={isDesktop ? "justify-center" : "mt-5"}
              style={{
                width: isDesktop ? 470 : "100%",
              }}
            >
              <View className="rounded-[30px] border border-[#E7ECF2] bg-white p-6">
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF8F1]">
                    <BadgeCheck size={20} color="#159A64" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[10px] font-extrabold tracking-[1.1px] text-[#159A64]">
                      EMAIL VERIFICATION
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Verify your email
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Enter the six-digit verification code sent to{" "}
                  <Text className="font-bold text-[#132F57]">
                    {email ? formatEmail(email) : "your email"}
                  </Text>
                  .
                </Text>

                {errorMessage ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-3.5">
                    <XCircle size={17} color="#BE123C" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                      {errorMessage}
                    </Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View className="mt-5 flex-row items-center rounded-[18px] border border-[#CDEBD9] bg-[#EAF8F1] px-4 py-3.5">
                    <CheckCircle2 size={17} color="#159A64" />

                    <Text className="ml-2 flex-1 text-xs font-semibold text-[#159A64]">
                      {successMessage}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-6">
                  <Text className="mb-2 text-xs font-semibold text-[#132F57]">
                    Verification code
                  </Text>

                  <View
                    className={`rounded-[22px] border px-4 py-4 ${
                      code.length === 6
                        ? "border-[#CDEBD9] bg-[#F2FBF7]"
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
                        code.length === 6 ? "text-[#159A64]" : "text-[#94A3B8]"
                      }`}
                    >
                      {code.length}/6
                    </Text>
                  </View>
                </View>

                <Pressable
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    isVerifying || code.length !== 6
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
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
                        Verify Email
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* RESEND */}
                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <Text className="text-xs font-bold text-[#132F57]">
                    Didn&apos;t receive the code?
                  </Text>

                  <Text className="mt-1 text-[10px] leading-5 text-[#64748B]">
                    You can request another verification code when the timer
                    reaches zero.
                  </Text>

                  <Pressable
                    className={`mt-3 flex-row items-center justify-center rounded-2xl border py-3.5 ${
                      resendSeconds > 0
                        ? "border-[#E2E8F0] bg-white"
                        : "border-[#159A64] bg-white active:opacity-70"
                    }`}
                    onPress={handleResend}
                    disabled={isResending || isVerifying || resendSeconds > 0}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color="#159A64" />
                    ) : (
                      <>
                        <RefreshCw
                          size={15}
                          color={resendSeconds > 0 ? "#94A3B8" : "#159A64"}
                        />

                        <Text
                          className={`ml-2 text-xs font-bold ${
                            resendSeconds > 0
                              ? "text-[#94A3B8]"
                              : "text-[#159A64]"
                          }`}
                        >
                          {resendSeconds > 0
                            ? `Resend in ${resendSeconds}s`
                            : "Resend verification code"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* APPROVAL INFO */}
                <View className="mt-4 flex-row items-start rounded-[18px] border border-[#FDE7B1] bg-[#FFF7E6] p-4">
                  <ShieldCheck size={16} color="#B7791F" />

                  <Text className="ml-2 flex-1 text-[10px] leading-5 text-[#92400E]">
                    After email verification, your provider account will remain
                    pending until an administrator approves your profile.
                  </Text>
                </View>

                <Pressable
                  className="mt-4 items-center rounded-2xl border border-[#E2E8F0] bg-white py-3.5 active:opacity-70"
                  onPress={() => router.replace("/provider/login")}
                  disabled={isVerifying || isResending}
                >
                  <Text className="text-xs font-bold text-[#475569]">
                    Return to Provider Login
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure provider email verification
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
