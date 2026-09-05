import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react-native";
import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
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
              minHeight: isDesktop ? 650 : undefined,
            }}
          >
            <View className="flex-1 justify-between p-6">
              <View>
                <Pressable
                  onPress={() => router.back()}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:opacity-70"
                >
                  <ArrowLeft size={19} color="#FFFFFF" />
                </Pressable>

                <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#FF5A3C]">
                  <Text className="text-2xl font-extrabold text-white">DS</Text>
                </View>

                <Text
                  className={`mt-6 font-extrabold text-white ${
                    isTablet
                      ? "text-[34px] leading-[42px]"
                      : "text-[28px] leading-9"
                  }`}
                >
                  Join Dwaar Sewa
                </Text>

                <Text className="mt-3 max-w-[480px] text-sm leading-6 text-white/65">
                  Choose how you want to use Dwaar Sewa. You can book trusted
                  home services as a customer or offer your skills as a service
                  provider.
                </Text>
              </View>

              <View className="mt-8">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Trusted platform",
                    text: "Designed for secure local service bookings and provider work.",
                  },
                  {
                    icon: Sparkles,
                    title: "Simple experience",
                    text: "Create your account quickly and start using Dwaar Sewa.",
                  },
                  {
                    icon: BriefcaseBusiness,
                    title: "Two ways to join",
                    text: "Use Dwaar Sewa as a customer or build earnings as a provider.",
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

          {/* ROLE PANEL */}
          <View
            className={isDesktop ? "justify-center" : "mt-5"}
            style={{
              width: isDesktop ? 500 : "100%",
            }}
          >
            <View className="rounded-[30px] border border-[#E7ECF2] bg-white p-6">
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3EE]">
                  <UserRound size={20} color="#FF5A3C" />
                </View>

                <View className="ml-3">
                  <Text className="text-[10px] font-extrabold tracking-[1.1px] text-[#FF5A3C]">
                    CREATE ACCOUNT
                  </Text>

                  <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                    Choose your role
                  </Text>
                </View>
              </View>

              <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                Select how you&apos;d like to use Dwaar Sewa.
              </Text>

              {/* CUSTOMER */}
              <Pressable
                onPress={() => router.push("/auth/register")}
                className="mt-6 rounded-[24px] border border-[#FFD8CE] bg-[#FFF9F7] p-5 active:opacity-80"
              >
                <View className="flex-row items-center">
                  <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-[#FFF0EB]">
                    <UserRound size={24} color="#FF5A3C" />
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-base font-extrabold text-[#132F57]">
                      I&apos;m a customer
                    </Text>

                    <Text className="mt-1 text-xs leading-5 text-[#64748B]">
                      Book trusted home services
                    </Text>
                  </View>

                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white">
                    <ChevronRight size={19} color="#FF5A3C" />
                  </View>
                </View>

                <View className="mt-4 border-t border-[#FCE3DC] pt-4">
                  <Text className="text-[10px] leading-5 text-[#7C8798]">
                    Find services, manage bookings, save addresses and track
                    your service history.
                  </Text>
                </View>
              </Pressable>

              {/* PROVIDER */}
              <Pressable
                onPress={() => router.push("/provider/register")}
                className="mt-4 rounded-[24px] border border-[#CDEBD9] bg-[#F6FCF9] p-5 active:opacity-80"
              >
                <View className="flex-row items-center">
                  <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-[#EAF8F1]">
                    <Wrench size={24} color="#159A64" />
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-base font-extrabold text-[#132F57]">
                      I&apos;m a service provider
                    </Text>

                    <Text className="mt-1 text-xs leading-5 text-[#64748B]">
                      Offer your services and earn
                    </Text>
                  </View>

                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white">
                    <ChevronRight size={19} color="#159A64" />
                  </View>
                </View>

                <View className="mt-4 border-t border-[#DCEFE5] pt-4">
                  <Text className="text-[10px] leading-5 text-[#7C8798]">
                    Join as a verified provider, receive assigned jobs and
                    manage your earnings.
                  </Text>
                </View>
              </Pressable>

              {/* LOGIN */}
              <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                <Text className="text-center text-xs font-bold text-[#132F57]">
                  Already have an account?
                </Text>

                <Pressable
                  onPress={() => router.push("/auth/login")}
                  className="mt-3 items-center rounded-2xl border border-[#FF5A3C] bg-white py-3.5 active:opacity-70"
                >
                  <Text className="text-xs font-bold text-[#FF5A3C]">
                    Sign in
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.back()}
                className="mt-4 items-center py-2 active:opacity-70"
              >
                <Text className="text-xs font-semibold text-[#94A3B8]">
                  Maybe later
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row items-center justify-center">
              <ShieldCheck size={14} color="#94A3B8" />

              <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                Choose the account type that fits you
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
