import { useState } from "react";
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
import { useRouter } from "expo-router";
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
  UserRound,
  UserRoundPlus,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useProviderAuth } from "@/context/ProviderAuthContext";
import { safeBack } from "@/utils/navigation";

type LoginRole = "customer" | "provider";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { loginProvider } = useProviderAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [role, setRole] = useState<LoginRole>("customer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectRole(nextRole: LoginRole) {
    setRole(nextRole);
    setError(null);
  }

  async function handleLogin() {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password) {
      setError("Enter your phone/email and password");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const isEmail = trimmedIdentifier.includes("@");

      if (role === "provider") {
        await loginProvider({
          ...(isEmail
            ? { email: trimmedIdentifier.toLowerCase() }
            : { phone: trimmedIdentifier }),
          password,
        });

        router.replace("/provider");
      } else {
        await login(trimmedIdentifier, password);
        router.replace("/");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Login failed. Check your details.",
      );
    } finally {
      setLoading(false);
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
                minHeight: isDesktop ? 680 : undefined,
              }}
            >
              <View className="flex-1 justify-between p-6">
                <View>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:opacity-70"
                    onPress={() => safeBack(router, "/auth/choose-role")}
                    disabled={loading}
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#FF5A3C]">
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
                    Welcome back to Dwaar Sewa
                  </Text>

                  <Text className="mt-3 max-w-[480px] text-sm leading-6 text-white/65">
                    Sign in to book trusted home services or manage your
                    provider work from one secure account portal.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Trusted local services",
                      text: "Book verified professionals for your home.",
                    },
                    {
                      icon: Sparkles,
                      title: "Simple booking experience",
                      text: "Find services, book quickly and track progress.",
                    },
                    {
                      icon: BriefcaseBusiness,
                      title: "Provider access included",
                      text: "Service providers can switch roles and sign in here too.",
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

            {/* LOGIN PANEL */}
            <View
              className={isDesktop ? "justify-center" : "mt-5"}
              style={{
                width: isDesktop ? 470 : "100%",
              }}
            >
              <View className="rounded-[30px] border border-[#E7ECF2] bg-white p-6">
                <View className="flex-row items-center">
                  <View
                    className={`h-11 w-11 items-center justify-center rounded-2xl ${
                      role === "provider" ? "bg-[#EAF8F1]" : "bg-[#FFF3EE]"
                    }`}
                  >
                    {role === "provider" ? (
                      <BadgeCheck size={20} color="#159A64" />
                    ) : (
                      <UserRound size={20} color="#FF5A3C" />
                    )}
                  </View>

                  <View className="ml-3">
                    <Text
                      className={`text-[10px] font-extrabold tracking-[1.1px] ${
                        role === "provider"
                          ? "text-[#159A64]"
                          : "text-[#FF5A3C]"
                      }`}
                    >
                      {role === "provider"
                        ? "PROVIDER ACCESS"
                        : "CUSTOMER ACCESS"}
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Welcome back
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  {role === "provider"
                    ? "Sign in to manage your provider jobs, profile and earnings."
                    : "Sign in to book trusted home services and manage your bookings."}
                </Text>

                {/* ROLE SWITCH */}
                <View className="mt-6 flex-row rounded-[18px] border border-[#E7ECF2] bg-[#F8FAFC] p-1">
                  <Pressable
                    onPress={() => selectRole("customer")}
                    className={`flex-1 items-center rounded-[14px] py-3 ${
                      role === "customer"
                        ? "bg-[#FF5A3C]"
                        : "bg-transparent active:opacity-70"
                    }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        role === "customer" ? "text-white" : "text-[#64748B]"
                      }`}
                    >
                      Customer
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => selectRole("provider")}
                    className={`flex-1 items-center rounded-[14px] py-3 ${
                      role === "provider"
                        ? "bg-[#159A64]"
                        : "bg-transparent active:opacity-70"
                    }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        role === "provider" ? "text-white" : "text-[#64748B]"
                      }`}
                    >
                      Service Provider
                    </Text>
                  </Pressable>
                </View>

                {error ? (
                  <View className="mt-5 rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] px-4 py-3.5">
                    <Text className="text-xs font-semibold leading-5 text-[#BE123C]">
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* IDENTIFIER */}
                <View className="mt-6">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Phone number or email
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
                      value={identifier}
                      onChangeText={(value) => {
                        setIdentifier(value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="98XXXXXXXX or you@example.com"
                      placeholderTextColor="#94A3B8"
                      editable={!loading}
                      className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] py-3.5 pl-11 pr-4 text-sm text-[#132F57]"
                    />
                  </View>
                </View>

                {/* PASSWORD */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Password
                  </Text>
                  {/* FORGOT PASSWORD */}
                  <View className="mt-3 flex-row justify-end">
                    <Pressable
                      onPress={() => {
                        if (role === "provider") {
                          router.push("/provider/forgot-password");
                        } else {
                          router.push("/auth/forgot-password");
                        }
                      }}
                      disabled={loading}
                      className="py-1 active:opacity-70"
                      hitSlop={8}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          role === "provider"
                            ? "text-[#159A64]"
                            : "text-[#FF5A3C]"
                        }`}
                      >
                        Forgot password?
                      </Text>
                    </Pressable>
                  </View>

                  <View className="h-14 flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] px-4">
                    <LockKeyhole size={16} color="#64748B" />

                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      secureTextEntry={!showPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      className="ml-3 flex-1 border-0 bg-transparent text-sm text-[#132F57] outline-none"
                    />

                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      className="ml-2 h-9 w-9 items-center justify-center rounded-xl active:opacity-60"
                      hitSlop={10}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff size={17} color="#64748B" />
                      ) : (
                        <Eye size={17} color="#64748B" />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    loading
                      ? role === "provider"
                        ? "bg-[#86D9B2]"
                        : "bg-[#FFB09E]"
                      : role === "provider"
                        ? "bg-[#159A64] active:opacity-80"
                        : "bg-[#FF5A3C] active:opacity-80"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <BadgeCheck size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Sign in
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* SIGN UP */}
                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <View className="flex-row items-center">
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-xl ${
                        role === "provider" ? "bg-[#EAF8F1]" : "bg-[#FFF3EE]"
                      }`}
                    >
                      <UserRoundPlus
                        size={18}
                        color={role === "provider" ? "#159A64" : "#FF5A3C"}
                      />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-[#132F57]">
                        Don&apos;t have an account?
                      </Text>

                      <Text className="mt-0.5 text-[10px] leading-5 text-[#64748B]">
                        Create an account and get started with Dwaar Sewa.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => router.push("/auth/choose-role")}
                    disabled={loading}
                    className={`mt-3 items-center rounded-2xl border bg-white py-3.5 active:opacity-70 ${
                      role === "provider"
                        ? "border-[#159A64]"
                        : "border-[#FF5A3C]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        role === "provider"
                          ? "text-[#159A64]"
                          : "text-[#FF5A3C]"
                      }`}
                    >
                      Sign up
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => safeBack(router, "/auth/choose-role")}
                  disabled={loading}
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
                  Secure Dwaar Sewa account access
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
