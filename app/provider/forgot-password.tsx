import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";

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
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react-native";

import { requestProviderPasswordReset } from "@/api/provider-auth";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  retry_after_seconds?: number;
}

export default function ProviderForgotPasswordScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateEmail(): boolean {
    setEmailError("");
    setFormError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Email is required");

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address");

      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateEmail() || isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setIsSubmitting(true);
      setFormError("");

      const result = await requestProviderPasswordReset(normalizedEmail);

      router.push({
        pathname: "/provider/verify-reset-otp",
        params: {
          email: normalizedEmail,
          resendSeconds: result.otp_resend_after_seconds?.toString() ?? "60",
        },
      });
    } catch (error) {
      console.error("Provider forgot password error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setFormError(
          error.response?.data?.message ??
            "Unable to request a password reset code.",
        );

        return;
      }

      setFormError("Something went wrong while requesting the reset code.");
    } finally {
      setIsSubmitting(false);
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
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#159A64]">
                    <KeyRound size={28} color="#FFFFFF" />
                  </View>

                  <Text
                    className={`mt-6 font-extrabold text-white ${
                      isTablet
                        ? "text-[34px] leading-[42px]"
                        : "text-[28px] leading-9"
                    }`}
                  >
                    Reset your provider password
                  </Text>

                  <Text className="mt-3 max-w-[480px] text-sm leading-6 text-white/65">
                    Enter your registered provider email and we&apos;ll send a
                    secure six-digit code to continue the password reset.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: Mail,
                      title: "Reset code by email",
                      text: "We send the OTP to your registered provider email address.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure verification",
                      text: "The reset code is temporary and can only be used once.",
                    },
                    {
                      icon: Sparkles,
                      title: "Return to work quickly",
                      text: "Verify the code, set a new password, and sign back in.",
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

            {/* RESET FORM */}
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
                      PASSWORD RECOVERY
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Forgot password?
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Enter the email address linked to your provider account.
                  We&apos;ll send you a six-digit reset code.
                </Text>

                {formError ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-3.5">
                    <XCircle size={17} color="#BE123C" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                      {formError}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-6">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Email address
                  </Text>

                  <View className="relative">
                    <Mail
                      size={16}
                      color="#64748B"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: 19,
                        zIndex: 1,
                      }}
                    />

                    <TextInput
                      className={`h-14 rounded-2xl border py-3.5 pl-11 pr-4 text-sm text-[#132F57] ${
                        emailError
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);

                        if (emailError) {
                          setEmailError("");
                        }

                        if (formError) {
                          setFormError("");
                        }
                      }}
                      placeholder="provider@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  {emailError ? (
                    <View className="mt-2 flex-row items-start">
                      <XCircle size={14} color="#DC2626" />

                      <Text className="ml-1.5 flex-1 text-[11px] text-[#DC2626]">
                        {emailError}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    isSubmitting
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
                  }`}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <KeyRound size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Send Reset Code
                      </Text>
                    </>
                  )}
                </Pressable>

                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <View className="flex-row items-start">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FF]">
                      <LockKeyhole size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-[#132F57]">
                        Remember your password?
                      </Text>

                      <Text className="mt-0.5 text-[10px] leading-5 text-[#64748B]">
                        Return to the provider login page and continue with your
                        existing password.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className="mt-3 items-center rounded-2xl border border-[#159A64] bg-white py-3.5 active:opacity-70"
                    onPress={() => router.replace("/provider/login")}
                    disabled={isSubmitting}
                  >
                    <Text className="text-xs font-bold text-[#159A64]">
                      Return to Provider Login
                    </Text>
                  </Pressable>
                </View>

                <View className="mt-4 flex-row items-start rounded-[18px] border border-[#FDE7B1] bg-[#FFF7E6] p-4">
                  <ShieldCheck size={16} color="#B7791F" />

                  <Text className="ml-2 flex-1 text-[10px] leading-5 text-[#92400E]">
                    For your security, the reset code expires after a short
                    period and can only be used once.
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure provider password recovery
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
