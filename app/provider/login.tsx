import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  UsersRound,
  XCircle,
} from "lucide-react-native";

import { useProviderAuth } from "@/context/ProviderAuthContext";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  email_verification_required?: boolean;
  email?: string;
}

export default function ProviderLoginScreen() {
  const { loginProvider } = useProviderAuth();
  const { registered } = useLocalSearchParams<{ registered?: string }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [formError, setFormError] = useState("");

  function validateForm(): boolean {
    setEmailError("");
    setPasswordError("");
    setFormError("");

    let isValid = true;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Email is required");

      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address");

      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");

      isValid = false;
    }

    return isValid;
  }

  async function handleLogin() {
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      await loginProvider({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace("/provider");
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        if (
          responseData?.code === "EMAIL_NOT_VERIFIED" ||
          responseData?.email_verification_required
        ) {
          router.push({
            pathname: "/provider/verify-email",
            params: {
              email: responseData.email ?? email.trim().toLowerCase(),
            },
          });

          return;
        }

        setFormError(
          responseData?.message ??
            "Unable to log in. Please check your details.",
        );

        return;
      }

      console.error("Provider login error:", error);

      setFormError("Something went wrong. Please try again.");
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
            className={isDesktop ? "flex-row px-5 py-5 gap-5" : "px-5 py-5"}
          >
            {/* LEFT BRAND PANEL */}
            <View
              className="rounded-[30px] bg-[#132F57] overflow-hidden"
              style={{
                flex: isDesktop ? 1 : undefined,
                minHeight: isDesktop ? 680 : undefined,
              }}
            >
              <View className="p-6 flex-1 justify-between">
                <View>
                  <Pressable
                    onPress={() => safeBack(router, "/auth/choose-role")}
                    disabled={isSubmitting}
                    className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:opacity-70"
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#159A64]">
                    <Text className="text-2xl font-extrabold text-white">
                      DS
                    </Text>
                  </View>

                  <Text
                    className={`mt-6 font-extrabold text-white ${
                      isTablet
                        ? "text-[34px] leading-[42px]"
                        : "text-[28px] leading-9"
                    }`}
                  >
                    Work with Dwaar Sewa
                  </Text>

                  <Text className="mt-3 max-w-[470px] text-sm leading-6 text-white/65">
                    Manage service requests, earnings, availability and your
                    professional provider account from one place.
                  </Text>
                </View>

                <View className={isDesktop ? "mt-10" : "mt-8"}>
                  {[
                    {
                      icon: BriefcaseBusiness,
                      title: "Manage your jobs",
                      text: "Review new requests and track active work.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Build customer trust",
                      text: "Maintain your verified professional profile.",
                    },
                    {
                      icon: Sparkles,
                      title: "Grow your earnings",
                      text: "Track income, wallet activity and payouts.",
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

            {/* LOGIN PANEL */}
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
                      PROVIDER PORTAL
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Welcome back
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Sign in with your registered provider account to continue.
                </Text>

                {registered === "1" ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#CDEBD9] bg-[#EAF8F1] px-4 py-3.5">
                    <BadgeCheck size={17} color="#159A64" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#159A64]">
                      Account created successfully. Please sign in.
                    </Text>
                  </View>
                ) : null}

                {formError ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-3.5">
                    <XCircle size={17} color="#BE123C" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                      {formError}
                    </Text>
                  </View>
                ) : null}

                {/* EMAIL */}
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
                        top: 17,
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
                      returnKeyType="next"
                    />
                  </View>

                  {emailError ? (
                    <Text className="mt-2 text-[11px] text-[#DC2626]">
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                {/* PASSWORD */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Password
                  </Text>

                  <View
                    className={`h-14 flex-row items-center rounded-2xl border px-4 ${
                      passwordError
                        ? "border-[#FCA5A5] bg-[#FFF7F7]"
                        : "border-[#E2E8F0] bg-[#FAFBFC]"
                    }`}
                  >
                    <LockKeyhole size={16} color="#64748B" />

                    <TextInput
                      className="ml-3 flex-1 text-sm text-[#132F57]"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);

                        if (passwordError) {
                          setPasswordError("");
                        }

                        if (formError) {
                          setFormError("");
                        }
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />

                    <Pressable
                      className="ml-3 h-9 w-9 items-center justify-center rounded-xl active:opacity-60"
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

                  {passwordError ? (
                    <Text className="mt-2 text-[11px] text-[#DC2626]">
                      {passwordError}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  className="mt-2 self-end py-2 active:opacity-70"
                  onPress={() => router.push("/provider/forgot-password")}
                  disabled={isSubmitting}
                >
                  <Text className="text-xs font-bold text-[#159A64]">
                    Forgot password?
                  </Text>
                </Pressable>

                <Pressable
                  className={`mt-4 h-14 items-center justify-center rounded-2xl ${
                    isSubmitting
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
                  }`}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View className="flex-row items-center">
                      <BadgeCheck size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Sign in as Provider
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* REGISTER */}
                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8F1]">
                      <UserRoundPlus size={18} color="#159A64" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-[#132F57]">
                        New provider?
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Create your provider account to get started.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className="mt-3 items-center rounded-2xl border border-[#159A64] bg-white py-3.5 active:opacity-70"
                    onPress={() => router.push("/provider/register")}
                    disabled={isSubmitting}
                  >
                    <Text className="text-xs font-bold text-[#159A64]">
                      Create Provider Account
                    </Text>
                  </Pressable>
                </View>

                {/* CUSTOMER SWITCH */}
                <View className="mt-4 rounded-[20px] border border-[#E7ECF2] bg-white p-4">
                  <View className="flex-row items-start">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FF]">
                      <UsersRound size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-[#132F57]">
                        Looking for services?
                      </Text>

                      <Text className="mt-0.5 text-[10px] leading-5 text-[#64748B]">
                        Customer account holders should use the regular customer
                        login.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className="mt-3 items-center rounded-2xl bg-[#EEF4FF] py-3.5 active:opacity-70"
                    onPress={() => router.replace("/auth/login")}
                    disabled={isSubmitting}
                  >
                    <Text className="text-xs font-bold text-[#3563E9]">
                      Go to Customer Login
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure provider access
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
