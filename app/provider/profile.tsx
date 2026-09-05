import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";

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
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react-native";

import { useProviderAuth } from "@/context/ProviderAuthContext";

interface ApiErrorResponse {
  message?: string;
}

function getVerificationStyle(status?: string) {
  switch (status) {
    case "approved":
      return {
        container: "border-[#CDEBD9] bg-[#EAF8F1]",
        text: "text-[#159A64]",
        label: "Approved",
        iconColor: "#159A64",
      };

    case "rejected":
      return {
        container: "border-[#FECDD3] bg-[#FFF1F2]",
        text: "text-[#DC2626]",
        label: "Rejected",
        iconColor: "#DC2626",
      };

    case "suspended":
      return {
        container: "border-[#FED7AA] bg-[#FFF7ED]",
        text: "text-[#C2410C]",
        label: "Suspended",
        iconColor: "#C2410C",
      };

    default:
      return {
        container: "border-[#FDE7B1] bg-[#FFF7E6]",
        text: "text-[#B7791F]",
        label: "Pending Approval",
        iconColor: "#B7791F",
      };
  }
}

export default function ProviderProfileScreen() {
  const {
    provider,
    isProviderLoading,
    isProviderAuthenticated,
    refreshProvider,
    logoutProvider,
  } = useProviderAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  async function handleRefresh() {
    try {
      setIsRefreshing(true);
      setErrorMessage("");

      const refreshedProvider = await refreshProvider();

      if (!refreshedProvider) {
        setErrorMessage("Unable to refresh the provider profile.");
      }
    } catch (error) {
      console.error("Refresh provider profile error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.message ??
            "Unable to refresh the provider profile.",
        );
      } else {
        setErrorMessage("Unable to refresh the provider profile.");
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogout() {
    await logoutProvider();
    router.replace("/provider/login");
  }

  if (isProviderLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#159A64" />
        </View>

        <Text className="mt-3 text-xs text-[#64748B]">
          Loading provider profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!isProviderAuthenticated || !provider) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <View className="w-full max-w-[460px] rounded-[28px] border border-[#E7ECF2] bg-white p-7 items-center">
          <View className="w-16 h-16 rounded-[22px] bg-[#EAF8F1] items-center justify-center">
            <UserRound size={28} color="#159A64" />
          </View>

          <Text className="mt-5 text-center text-xl font-extrabold text-[#132F57]">
            Provider login required
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-[#64748B]">
            Sign in to manage your provider profile, work details and
            verification status.
          </Text>

          <Pressable
            className="mt-6 w-full rounded-2xl bg-[#159A64] py-4 items-center active:opacity-80"
            onPress={() => router.replace("/provider/login")}
          >
            <Text className="font-bold text-white">Go to Provider Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const verificationStyle = getVerificationStyle(
    provider.profile?.verification_status,
  );

  const initials = provider.full_name
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const categories = provider.category_experience ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
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

              <View className="flex-row items-center">
                <Pressable
                  className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center mr-2 active:opacity-70"
                  disabled={isRefreshing}
                  onPress={() => {
                    void handleRefresh();
                  }}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#159A64" />
                  ) : (
                    <RefreshCw size={17} color="#159A64" />
                  )}
                </Pressable>

                <Pressable
                  className="flex-row items-center rounded-2xl bg-[#159A64] px-4 py-3 active:opacity-80"
                  onPress={() => router.push("/provider/edit-profile")}
                >
                  <Pencil size={15} color="#FFFFFF" />

                  <Text className="ml-2 text-xs font-bold text-white">
                    Edit Profile
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-[11px] font-extrabold tracking-[1.2px] text-[#159A64]">
                PROVIDER PROFILE
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Your professional profile
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Review your account, verification, experience and provider
                performance.
              </Text>
            </View>
          </View>

          {/* PROFILE HERO */}
          <View className="px-5 mt-5">
            <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
              <View
                className={
                  isTablet ? "flex-row items-center justify-between" : ""
                }
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-20 h-20 rounded-[26px] bg-white/10 border border-white/10 items-center justify-center">
                    <Text className="text-white text-2xl font-extrabold">
                      {initials || "DS"}
                    </Text>
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-white text-xl font-extrabold">
                      {provider.full_name}
                    </Text>

                    <Text
                      className="text-white/60 text-xs mt-1"
                      numberOfLines={1}
                    >
                      {provider.email ?? "No email"}
                    </Text>

                    <View
                      className={`mt-3 self-start flex-row items-center rounded-full border px-3 py-1.5 ${verificationStyle.container}`}
                    >
                      <BadgeCheck
                        size={13}
                        color={verificationStyle.iconColor}
                      />

                      <Text
                        className={`ml-1.5 text-[10px] font-extrabold ${verificationStyle.text}`}
                      >
                        {verificationStyle.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className={isTablet ? "w-[310px] ml-6" : "mt-5"}>
                  <View className="rounded-[20px] bg-white/10 p-4">
                    <View className="flex-row items-center">
                      <ShieldCheck size={17} color="#5DD39E" />

                      <Text className="ml-2 text-white text-xs font-bold">
                        Provider status
                      </Text>
                    </View>

                    <Text className="mt-2 text-white/65 text-[10px] leading-5">
                      Keep your profile information accurate so customers and
                      the Dwaar Sewa team can rely on your professional details.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ERROR */}
          {errorMessage ? (
            <View className="px-5 mt-4">
              <View className="rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-4">
                <Text className="text-xs leading-5 font-semibold text-[#BE123C]">
                  {errorMessage}
                </Text>
              </View>
            </View>
          ) : null}

          {/* PERFORMANCE */}
          <View className="px-5 mt-6">
            <Text className="text-[#132F57] text-xl font-extrabold">
              Performance
            </Text>

            <Text className="text-[#64748B] text-xs mt-1">
              Your current service record
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
                <View className="w-10 h-10 rounded-2xl bg-[#FFF7E6] items-center justify-center">
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                </View>

                <Text className="mt-4 text-[#132F57] text-2xl font-extrabold">
                  {provider.profile?.average_rating ?? 0}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">
                  Average rating
                </Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                  <BriefcaseBusiness size={18} color="#159A64" />
                </View>

                <Text className="mt-4 text-[#132F57] text-2xl font-extrabold">
                  {provider.profile?.total_completed_jobs ?? 0}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">
                  Completed jobs
                </Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                  <Sparkles size={18} color="#3563E9" />
                </View>

                <Text className="mt-4 text-[#132F57] text-2xl font-extrabold">
                  {provider.profile?.total_reviews ?? 0}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">
                  Total reviews
                </Text>
              </View>

              <View
                className="bg-white border border-[#E7ECF2] rounded-[22px] p-4 mb-3"
                style={{
                  width: isTablet ? undefined : "48.5%",
                  flex: isTablet ? 1 : undefined,
                }}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#F3F0FF] items-center justify-center">
                  <BadgeCheck size={18} color="#6D44C5" />
                </View>

                <Text className="mt-4 text-[#132F57] text-2xl font-extrabold">
                  {provider.profile?.years_of_experience ?? 0}
                </Text>

                <Text className="mt-1 text-[11px] text-[#64748B]">
                  Years experience
                </Text>
              </View>
            </View>
          </View>

          <View
            className={
              isDesktop ? "flex-row px-5 mt-2 gap-5 items-start" : "px-5 mt-2"
            }
          >
            {/* LEFT COLUMN */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
            >
              {/* PERSONAL INFO */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <View className="flex-row items-center mb-5">
                  <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                    <UserRound size={18} color="#3563E9" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Personal information
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-0.5">
                      Contact and professional details
                    </Text>
                  </View>
                </View>

                <View className="rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4">
                  <View className="flex-row items-start">
                    <Phone size={16} color="#64748B" />

                    <View className="ml-3 flex-1">
                      <Text className="text-[#94A3B8] text-[9px] font-bold">
                        PHONE
                      </Text>

                      <Text className="text-[#132F57] text-sm font-semibold mt-1">
                        {provider.phone}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-[#E2E8F0] my-4" />

                  <View className="flex-row items-start">
                    <Mail size={16} color="#64748B" />

                    <View className="ml-3 flex-1">
                      <Text className="text-[#94A3B8] text-[9px] font-bold">
                        EMAIL
                      </Text>

                      <Text className="text-[#132F57] text-sm font-semibold mt-1">
                        {provider.email ?? "No email"}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-[#E2E8F0] my-4" />

                  <View className="flex-row items-start">
                    <MapPin size={16} color="#64748B" />

                    <View className="ml-3 flex-1">
                      <Text className="text-[#94A3B8] text-[9px] font-bold">
                        ADDRESS
                      </Text>

                      <Text className="text-[#132F57] text-sm leading-6 font-semibold mt-1">
                        {provider.profile?.address ??
                          "Address has not been added"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ABOUT */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  About
                </Text>

                <Text className="text-[#64748B] text-sm leading-6 mt-3">
                  {provider.profile?.bio ??
                    "No professional bio has been added"}
                </Text>
              </View>

              {/* CATEGORIES */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl bg-[#EAF8F1] items-center justify-center">
                    <BriefcaseBusiness size={18} color="#159A64" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#132F57] text-lg font-extrabold">
                      Categories & experience
                    </Text>

                    <Text className="text-[#64748B] text-[10px] mt-0.5">
                      Services assigned to your provider account
                    </Text>
                  </View>
                </View>

                {categories.length === 0 ? (
                  <View className="rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-7 items-center">
                    <Text className="text-[#64748B] text-xs">
                      No service categories assigned.
                    </Text>
                  </View>
                ) : (
                  <View>
                    {categories.map((item, index) => (
                      <View
                        key={item.category_id}
                        className={`flex-row items-center justify-between py-4 ${
                          index < categories.length - 1
                            ? "border-b border-[#EEF2F6]"
                            : ""
                        }`}
                      >
                        <View className="flex-row items-center flex-1 pr-3">
                          <View className="w-9 h-9 rounded-xl bg-[#F5F7FA] items-center justify-center">
                            <BriefcaseBusiness size={15} color="#64748B" />
                          </View>

                          <Text className="ml-3 text-[#132F57] text-sm font-bold">
                            {item.category_name}
                          </Text>
                        </View>

                        <View className="rounded-full bg-[#EAF8F1] px-3 py-1.5">
                          <Text className="text-[#159A64] text-[10px] font-extrabold">
                            {item.experience_type.name}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* VERIFICATION MESSAGES */}
              {provider.profile?.verification_note ? (
                <View className="mt-4 rounded-[26px] border border-[#FDE7B1] bg-[#FFF7E6] p-5">
                  <View className="flex-row items-start">
                    <BadgeCheck size={18} color="#B7791F" />

                    <View className="flex-1 ml-3">
                      <Text className="text-[#92400E] text-sm font-extrabold">
                        Verification note
                      </Text>

                      <Text className="mt-2 text-[#92400E] text-xs leading-5">
                        {provider.profile.verification_note}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {provider.profile?.rejection_reason ? (
                <View className="mt-4 rounded-[26px] border border-[#FECDD3] bg-[#FFF1F2] p-5">
                  <View className="flex-row items-start">
                    <ShieldCheck size={18} color="#DC2626" />

                    <View className="flex-1 ml-3">
                      <Text className="text-[#991B1B] text-sm font-extrabold">
                        Rejection reason
                      </Text>

                      <Text className="mt-2 text-[#991B1B] text-xs leading-5">
                        {provider.profile.rejection_reason}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {/* RIGHT COLUMN */}
            <View
              style={{
                width: isDesktop ? 360 : "100%",
                marginTop: isDesktop ? 0 : 16,
              }}
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <Text className="text-[#132F57] text-lg font-extrabold">
                  Profile actions
                </Text>

                <Text className="text-[#64748B] text-[10px] mt-1">
                  Manage your professional account
                </Text>

                <Pressable
                  onPress={() => router.push("/provider/edit-profile")}
                  className="mt-4 flex-row items-center justify-between rounded-2xl bg-[#EAF8F1] border border-[#CDEBD9] px-4 py-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
                      <Pencil size={17} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Edit profile
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Update your details
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#159A64" />
                </Pressable>

                <Pressable
                  onPress={() => router.push("/provider/bookings")}
                  className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <BriefcaseBusiness size={17} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        My jobs
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        View provider work
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#3563E9" />
                </Pressable>

                <Pressable
                  onPress={() => router.push("/provider/earnings")}
                  className="mt-3 flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] px-4 py-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#FFF7E6] items-center justify-center">
                      <Star size={17} color="#B7791F" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#132F57] text-xs font-bold">
                        Earnings
                      </Text>

                      <Text className="text-[#64748B] text-[10px] mt-0.5">
                        Wallet and payouts
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#B7791F" />
                </Pressable>
              </View>

              <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                  <Sparkles size={20} color="#5DD39E" />
                </View>

                <Text className="text-white text-base font-extrabold mt-4">
                  Build customer trust
                </Text>

                <Text className="text-white/65 text-xs leading-5 mt-1">
                  Keep your provider details complete and accurate to help
                  customers feel confident when you're assigned to their job.
                </Text>
              </View>

              <Pressable
                className="mt-4 flex-row items-center justify-between rounded-[20px] border border-[#FECACA] bg-[#FFF7F7] px-4 py-4 active:opacity-70"
                onPress={handleLogout}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-[#FEE2E2] items-center justify-center">
                    <LogOut size={17} color="#DC2626" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-[#991B1B] text-xs font-bold">
                      Log out
                    </Text>

                    <Text className="text-[#B91C1C] text-[10px] mt-0.5">
                      End provider session
                    </Text>
                  </View>
                </View>

                <ChevronRight size={17} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
