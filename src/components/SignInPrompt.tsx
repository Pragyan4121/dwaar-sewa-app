import React from "react";

import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react-native";

type SignInPromptProps = {
  title: string;
  message: string;
};

export function SignInPrompt({ title, message }: SignInPromptProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;
  const isTablet = width >= 700;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 48,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1000,
            alignSelf: "center",
            flex: 1,
          }}
          className="px-5"
        >
          {/* HEADER */}

          <View className="pt-4">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                <Sparkles size={19} color="#FF5A3C" />
              </View>

              <View className="ml-3">
                <Text className="text-[#132F57] text-sm font-extrabold">
                  Dwaar Sewa
                </Text>

                <Text className="mt-0.5 text-[#94A3B8] text-[10px] font-semibold">
                  YOUR HOME SERVICE ACCOUNT
                </Text>
              </View>
            </View>
          </View>

          {/* MAIN CONTENT */}

          <View
            className={
              isDesktop
                ? "flex-1 flex-row items-center py-10"
                : "flex-1 justify-center py-8"
            }
          >
            {/* LEFT / HERO */}

            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
              className={isDesktop ? "pr-8" : ""}
            >
              <View className="rounded-[32px] bg-[#132F57] p-6 overflow-hidden">
                {/* decorative shapes */}

                <View
                  style={{
                    position: "absolute",
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    right: -50,
                    top: -50,
                  }}
                />

                <View
                  style={{
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "rgba(255,90,60,0.10)",
                    left: -35,
                    bottom: -35,
                  }}
                />

                <View className="self-start flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                  <ShieldCheck size={13} color="#FFFFFF" />

                  <Text className="ml-1.5 text-white text-[10px] font-extrabold tracking-wide">
                    SECURE ACCESS
                  </Text>
                </View>

                <View className="mt-8 w-16 h-16 rounded-[24px] bg-[#FF5A3C] items-center justify-center">
                  <LockKeyhole size={28} color="#FFFFFF" />
                </View>

                <Text
                  className={`mt-6 text-white font-extrabold leading-tight ${
                    isTablet ? "text-[32px]" : "text-[27px]"
                  }`}
                >
                  {title}
                </Text>

                <Text className="mt-3 max-w-[520px] text-white/65 text-sm leading-6">
                  {message}
                </Text>

                <View className="mt-7 gap-3">
                  <View className="flex-row items-center rounded-[18px] bg-white/10 px-4 py-3.5">
                    <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                      <CalendarCheck2 size={17} color="#FFFFFF" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-white text-xs font-bold">
                        Keep everything in one place
                      </Text>

                      <Text className="mt-0.5 text-white/55 text-[10px] leading-4">
                        Access bookings, payments and service history anytime.
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center rounded-[18px] bg-white/10 px-4 py-3.5">
                    <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                      <BadgeCheck size={17} color="#FFFFFF" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-white text-xs font-bold">
                        Your activity stays connected
                      </Text>

                      <Text className="mt-0.5 text-white/55 text-[10px] leading-4">
                        Sign in on another device and continue where you left
                        off.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* RIGHT / ACTION CARD */}

            <View
              style={{
                width: isDesktop ? 390 : "100%",
              }}
              className={isDesktop ? "" : "mt-5"}
            >
              <View className="rounded-[28px] border border-[#E7ECF2] bg-white p-5">
                <View className="items-center">
                  <View className="w-14 h-14 rounded-[20px] bg-[#FFF3EE] items-center justify-center">
                    <ShieldCheck size={24} color="#FF5A3C" />
                  </View>

                  <Text className="mt-4 text-center text-[#132F57] text-lg font-extrabold">
                    Welcome back
                  </Text>

                  <Text className="mt-2 max-w-[310px] text-center text-[#64748B] text-xs leading-5">
                    Sign in to your Dwaar Sewa account to continue.
                  </Text>
                </View>

                {/* SIGN IN */}

                <Pressable
                  onPress={() => router.push("/auth/login")}
                  className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-[#FF5A3C] active:opacity-80"
                >
                  <LockKeyhole size={17} color="#FFFFFF" />

                  <Text className="ml-2 text-white text-sm font-bold">
                    Sign in
                  </Text>

                  <ArrowRight
                    size={17}
                    color="#FFFFFF"
                    style={{
                      marginLeft: 8,
                    }}
                  />
                </Pressable>

                {/* DIVIDER */}

                <View className="my-5 flex-row items-center">
                  <View className="h-px flex-1 bg-[#E7ECF2]" />

                  <Text className="mx-3 text-[#94A3B8] text-[10px] font-semibold">
                    NEW TO DWAAR SEWA?
                  </Text>

                  <View className="h-px flex-1 bg-[#E7ECF2]" />
                </View>

                {/* CREATE ACCOUNT */}

                <Pressable
                  onPress={() => router.push("/auth/choose-role")}
                  className="h-14 flex-row items-center justify-center rounded-2xl border border-[#FF5A3C] bg-white active:opacity-70"
                >
                  <UserPlus size={17} color="#FF5A3C" />

                  <Text className="ml-2 text-[#FF5A3C] text-sm font-bold">
                    Create account
                  </Text>
                </Pressable>

                <View className="mt-5 rounded-[18px] bg-[#F8FAFC] px-4 py-3.5">
                  <View className="flex-row items-start">
                    <ShieldCheck
                      size={15}
                      color="#64748B"
                      style={{
                        marginTop: 1,
                      }}
                    />

                    <Text className="ml-2 flex-1 text-[#64748B] text-[10px] leading-5">
                      Your account protects your booking, payment and service
                      information.
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
