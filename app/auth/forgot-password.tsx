import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";

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
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react-native";

import { requestCustomerPasswordReset } from "@/api/customer-auth";
import { safeBack } from "@/utils/navigation";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  retry_after_seconds?: number;
}

export default function CustomerForgotPasswordScreen() {
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

      const result = await requestCustomerPasswordReset(normalizedEmail);

      router.push({
        pathname: "/auth/verify-reset-otp",
        params: {
          email: normalizedEmail,
          resendSeconds: result.otp_resend_after_seconds?.toString() ?? "60",
        },
      });
    } catch (error) {
      console.error("Customer forgot password error:", error);

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
                    onPress={() => safeBack(router, "/auth/login")}
                    disabled={isSubmitting}
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
                    Reset your Dwaar Sewa password
                  </Text>

                  <Text className="mt-3 max-w-[480px] text-sm leading-6 text-white/65">
                    Enter the email connected to your customer account and
                    we&apos;ll send you a six-digit reset code.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: Mail,
                      title: "Reset code by email",
                      text: "A six-digit OTP will be sent to your registered email.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure verification",
                      text: "The reset code expires after a short period and can only be used once.",
                    },
                    {
                      icon: Sparkles,
                      title: "Quick recovery",
                      text: "Verify the code, create a new password and sign in again.",
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
                      PASSWORD RECOVERY
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Forgot password?
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Enter the email linked to your customer account.
                </Text>

                {formError ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
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
                      placeholder="you@example.com"
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
                    <Text className="mt-2 text-[11px] text-[#DC2626]">
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    isSubmitting
                      ? "bg-[#FFB09E]"
                      : "bg-[#FF5A3C] active:opacity-80"
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
                  <Text className="text-xs font-bold text-[#132F57]">
                    Remember your password?
                  </Text>

                  <Text className="mt-1 text-[10px] leading-5 text-[#64748B]">
                    Return to customer login and continue with your existing
                    password.
                  </Text>

                  <Pressable
                    className="mt-3 items-center rounded-2xl border border-[#FF5A3C] bg-white py-3.5 active:opacity-70"
                    onPress={() => router.replace("/auth/login")}
                    disabled={isSubmitting}
                  >
                    <Text className="text-xs font-bold text-[#FF5A3C]">
                      Return to Login
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure customer password recovery
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
