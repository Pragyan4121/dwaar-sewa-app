import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
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
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react-native";

import { resetProviderPassword } from "@/api/provider-auth";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  field?: string;
}

export default function ProviderResetPasswordScreen() {
  const params = useLocalSearchParams<{
    resetToken?: string | string[];
    email?: string | string[];
  }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const resetToken =
    typeof params.resetToken === "string" ? params.resetToken.trim() : "";

  const email =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm(): boolean {
    setNewPasswordError("");
    setConfirmPasswordError("");
    setFormError("");
    setSuccessMessage("");

    let isValid = true;

    if (!newPassword) {
      setNewPasswordError("New password is required");
      isValid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must contain at least 8 characters");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Password confirmation does not match");
      isValid = false;
    }

    if (!resetToken) {
      setFormError(
        "The password reset session is missing. Please request a new reset code.",
      );
      isValid = false;
    }

    return isValid;
  }

  async function handleResetPassword() {
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      await resetProviderPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage("Your provider password has been reset successfully.");

      setTimeout(() => {
        router.replace({
          pathname: "/provider/login",
          params: {
            passwordReset: "true",
            email,
          },
        });
      }, 900);
    } catch (error) {
      console.error("Provider reset password error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        if (responseData?.field === "newPassword") {
          setNewPasswordError(
            responseData.message ?? "Please enter a valid new password",
          );
          return;
        }

        if (responseData?.field === "confirmPassword") {
          setConfirmPasswordError(
            responseData.message ?? "Password confirmation is invalid",
          );
          return;
        }

        if (
          responseData?.code === "RESET_TOKEN_EXPIRED" ||
          responseData?.code === "INVALID_RESET_TOKEN"
        ) {
          setFormError(
            responseData.message ??
              "The password reset session is no longer valid.",
          );
          return;
        }

        setFormError(
          responseData?.message ?? "Unable to reset the provider password.",
        );

        return;
      }

      setFormError(
        "Something went wrong while resetting the provider password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isResetSessionError =
    formError.toLowerCase().includes("session") ||
    formError.toLowerCase().includes("token");

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
          contentContainerStyle={{ flexGrow: 1 }}
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
                    <LockKeyhole size={28} color="#FFFFFF" />
                  </View>

                  <Text
                    className={`mt-6 font-extrabold text-white ${
                      isTablet
                        ? "text-[34px] leading-[42px]"
                        : "text-[28px] leading-9"
                    }`}
                  >
                    Create a new provider password
                  </Text>

                  <Text className="mt-3 max-w-[480px] text-sm leading-6 text-white/65">
                    Choose a secure password for your provider account and get
                    back to managing your jobs safely.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: KeyRound,
                      title: "Verified reset session",
                      text: "Your password can only be changed through the secure reset flow.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Use a strong password",
                      text: "Choose a password that is difficult to guess and unique to your account.",
                    },
                    {
                      icon: Sparkles,
                      title: "Return to provider login",
                      text: "After a successful reset, you will be redirected to sign in again.",
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
              style={{ width: isDesktop ? 470 : "100%" }}
            >
              <View className="rounded-[30px] border border-[#E7ECF2] bg-white p-6">
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF8F1]">
                    <BadgeCheck size={20} color="#159A64" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[10px] font-extrabold tracking-[1.1px] text-[#159A64]">
                      PASSWORD RESET
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Create new password
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Choose a secure new password for your provider account.
                </Text>

                {email ? (
                  <View className="mt-4 rounded-[18px] border border-[#EEF2F6] bg-[#F8FAFC] px-4 py-3">
                    <Text className="text-[10px] font-semibold text-[#94A3B8]">
                      ACCOUNT
                    </Text>

                    <Text className="mt-1 text-xs font-bold text-[#132F57]">
                      {email}
                    </Text>
                  </View>
                ) : null}

                {formError ? (
                  <View className="mt-5 rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                    <View className="flex-row items-start">
                      <XCircle size={17} color="#BE123C" />

                      <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                        {formError}
                      </Text>
                    </View>

                    {isResetSessionError ? (
                      <Pressable
                        className="mt-3 self-start rounded-xl border border-[#FECDD3] bg-white px-4 py-2.5 active:opacity-70"
                        onPress={() =>
                          router.replace("/provider/forgot-password")
                        }
                        disabled={isSubmitting}
                      >
                        <Text className="text-xs font-bold text-[#BE123C]">
                          Request a new code
                        </Text>
                      </Pressable>
                    ) : null}
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

                {/* NEW PASSWORD */}
                <View className="mt-6">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    New password
                  </Text>

                  <View
                    className={`h-14 flex-row items-center rounded-2xl border px-4 ${
                      newPasswordError
                        ? "border-[#FCA5A5] bg-[#FFF7F7]"
                        : "border-[#E2E8F0] bg-[#FAFBFC]"
                    }`}
                  >
                    <LockKeyhole size={16} color="#64748B" />

                    <TextInput
                      className="ml-3 flex-1 text-sm text-[#132F57]"
                      value={newPassword}
                      onChangeText={(value) => {
                        setNewPassword(value);

                        if (newPasswordError) {
                          setNewPasswordError("");
                        }

                        if (formError) {
                          setFormError("");
                        }
                      }}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />

                    <Pressable
                      className="ml-2 h-9 w-9 items-center justify-center rounded-xl active:opacity-60"
                      onPress={() => setShowPassword((current) => !current)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff size={17} color="#64748B" />
                      ) : (
                        <Eye size={17} color="#64748B" />
                      )}
                    </Pressable>
                  </View>

                  {newPasswordError ? (
                    <View className="mt-2 flex-row items-start">
                      <XCircle size={14} color="#DC2626" />

                      <Text className="ml-1.5 flex-1 text-[11px] leading-5 text-[#DC2626]">
                        {newPasswordError}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* CONFIRM */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Confirm new password
                  </Text>

                  <TextInput
                    className={`h-14 rounded-2xl border px-4 text-sm text-[#132F57] ${
                      confirmPasswordError
                        ? "border-[#FCA5A5] bg-[#FFF7F7]"
                        : "border-[#E2E8F0] bg-[#FAFBFC]"
                    }`}
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);

                      if (confirmPasswordError) {
                        setConfirmPasswordError("");
                      }

                      if (formError) {
                        setFormError("");
                      }
                    }}
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />

                  {confirmPasswordError ? (
                    <View className="mt-2 flex-row items-start">
                      <XCircle size={14} color="#DC2626" />

                      <Text className="ml-1.5 flex-1 text-[11px] leading-5 text-[#DC2626]">
                        {confirmPasswordError}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* REQUIREMENTS */}
                <View className="mt-5 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <Text className="text-xs font-extrabold text-[#132F57]">
                    Password requirements
                  </Text>

                  {[
                    "At least 8 characters",
                    "Different from your current password",
                    "Use a combination that is difficult to guess",
                  ].map((item) => (
                    <View key={item} className="mt-3 flex-row items-start">
                      <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-[#EAF8F1]">
                        <CheckCircle2 size={11} color="#159A64" />
                      </View>

                      <Text className="ml-2 flex-1 text-[11px] leading-5 text-[#64748B]">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    isSubmitting || !resetToken || Boolean(successMessage)
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
                  }`}
                  onPress={handleResetPassword}
                  disabled={
                    isSubmitting || !resetToken || Boolean(successMessage)
                  }
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <KeyRound size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Reset Password
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  className="mt-4 items-center rounded-2xl border border-[#E2E8F0] bg-white py-3.5 active:opacity-70"
                  onPress={() => router.replace("/provider/login")}
                  disabled={isSubmitting}
                >
                  <Text className="text-xs font-bold text-[#475569]">
                    Return to Provider Login
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure provider password reset
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
