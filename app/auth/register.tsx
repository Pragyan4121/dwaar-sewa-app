import { useState } from "react";
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
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
  X,
  XCircle,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { safeBack } from "@/utils/navigation";

const NEPAL_PHONE_REGEX = /^9(7|8)\d{8}$/;

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "protonmail.com",
  "aol.com",
  "yahoo.co.in",
  "rediffmail.com",
];

const PASSWORD_RULES: {
  label: string;
  test: (password: string) => boolean;
}[] = [
  {
    label: "At least 6 characters",
    test: (password) => password.length >= 6,
  },
  {
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: "One special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

function isValidNepalPhone(phone: string): boolean {
  return NEPAL_PHONE_REGEX.test(phone.trim());
}

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();

  const match = trimmed.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);

  if (!match) {
    return false;
  }

  const domain = match[1];

  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!fullName || !phone || !password) {
      setError("Name, phone, and password are required.");

      return;
    }

    if (!isValidNepalPhone(phone)) {
      setError(
        "Enter a valid Nepal mobile number (10 digits, starting with 97 or 98).",
      );

      return;
    }

    if (email && !isValidEmail(email)) {
      setError(
        "Enter a valid email from a real provider (e.g. Gmail, Yahoo, Outlook).",
      );

      return;
    }

    if (!isStrongPassword(password)) {
      setError("Your password doesn't meet all the requirements below.");

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");

      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(fullName, phone, password, email || undefined);

      safeBack(router, "/auth/login");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Couldn't create account. Please try again.",
      );
    } finally {
      setLoading(false);
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            {/* LEFT BRAND PANEL */}
            <View
              className="overflow-hidden rounded-[30px] bg-[#132F57]"
              style={{
                flex: isDesktop ? 1 : undefined,
                minHeight: isDesktop ? 760 : undefined,
              }}
            >
              <View className="flex-1 justify-between p-6">
                <View>
                  <Pressable
                    onPress={() => safeBack(router, "/auth/login")}
                    disabled={loading}
                    className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:opacity-70"
                  >
                    <ArrowLeft size={19} color="#FFFFFF" />
                  </Pressable>

                  <View className="mt-8 h-16 w-16 items-center justify-center rounded-[22px] bg-[#FF5A3C]">
                    <UserRoundPlus size={27} color="#FFFFFF" />
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
                    Create your customer account and book trusted local
                    professionals whenever your home needs help.
                  </Text>
                </View>

                <View className="mt-8">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Trusted professionals",
                      text: "Book verified service providers for your home.",
                    },
                    {
                      icon: Sparkles,
                      title: "Simple booking",
                      text: "Choose services, schedule a time and track your booking.",
                    },
                    {
                      icon: BadgeCheck,
                      title: "Manage everything",
                      text: "View bookings, addresses, reviews and account details.",
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

            {/* REGISTER PANEL */}
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
                      CUSTOMER REGISTRATION
                    </Text>

                    <Text className="mt-0.5 text-xl font-extrabold text-[#132F57]">
                      Create your account
                    </Text>
                  </View>
                </View>

                <Text className="mt-3 text-sm leading-6 text-[#64748B]">
                  Join Dwaar Sewa to book trusted home services and manage your
                  bookings.
                </Text>

                {error ? (
                  <View className="mt-5 flex-row items-start rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                    <XCircle size={17} color="#BE123C" />

                    <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* FULL NAME */}
                <View className="mt-6">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Full name
                  </Text>

                  <View className="relative">
                    <UserRound
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
                      value={fullName}
                      onChangeText={(value) => {
                        setFullName(value);

                        if (error) {
                          setError(null);
                        }
                      }}
                      placeholder="Your full name"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                      editable={!loading}
                      className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] py-3.5 pl-11 pr-4 text-sm text-[#132F57]"
                    />
                  </View>
                </View>

                {/* PHONE */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Phone number
                  </Text>

                  <View className="relative">
                    <Phone
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
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text.replace(/[^0-9]/g, "").slice(0, 10));

                        if (error) {
                          setError(null);
                        }
                      }}
                      keyboardType="phone-pad"
                      placeholder="98XXXXXXXX"
                      placeholderTextColor="#94A3B8"
                      maxLength={10}
                      editable={!loading}
                      className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] py-3.5 pl-11 pr-4 text-sm text-[#132F57]"
                    />
                  </View>

                  <Text className="mt-2 text-[10px] text-[#94A3B8]">
                    Must start with 97 or 98 and contain exactly 10 digits.
                  </Text>
                </View>

                {/* EMAIL */}
                <View className="mt-4">
                  <View className="mb-1.5 flex-row items-center">
                    <Text className="text-xs font-semibold text-[#132F57]">
                      Email
                    </Text>

                    <Text className="ml-1 text-[10px] text-[#94A3B8]">
                      (optional)
                    </Text>
                  </View>

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
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);

                        if (error) {
                          setError(null);
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="you@gmail.com"
                      placeholderTextColor="#94A3B8"
                      editable={!loading}
                      className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] py-3.5 pl-11 pr-4 text-sm text-[#132F57]"
                    />
                  </View>

                  <Text className="mt-2 text-[10px] text-[#94A3B8]">
                    Gmail, Yahoo, Outlook and other supported email providers.
                  </Text>
                </View>

                {/* PASSWORD */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Password
                  </Text>

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
                      onFocus={() => setPasswordFocused(true)}
                      secureTextEntry={!showPassword}
                      placeholder="Create a strong password"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      className="ml-3 flex-1 text-sm text-[#132F57]"
                    />

                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                      className="ml-2 h-9 w-9 items-center justify-center rounded-xl active:opacity-60"
                      hitSlop={10}
                    >
                      {showPassword ? (
                        <EyeOff size={17} color="#64748B" />
                      ) : (
                        <Eye size={17} color="#64748B" />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* PASSWORD RULES */}
                {(passwordFocused || password.length > 0) && (
                  <View className="mt-3 rounded-[20px] border border-[#E7ECF2] bg-[#F8FAFC] p-4">
                    <Text className="mb-2 text-[10px] font-extrabold tracking-[0.8px] text-[#64748B]">
                      PASSWORD REQUIREMENTS
                    </Text>

                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);

                      return (
                        <View
                          key={rule.label}
                          className="mt-2 flex-row items-center"
                        >
                          <View
                            className={`h-5 w-5 items-center justify-center rounded-full ${
                              passed ? "bg-[#EAF8F1]" : "bg-[#EEF2F6]"
                            }`}
                          >
                            {passed ? (
                              <Check size={11} color="#159A64" />
                            ) : (
                              <X size={11} color="#94A3B8" />
                            )}
                          </View>

                          <Text
                            className={`ml-2 text-[11px] ${
                              passed
                                ? "font-semibold text-[#159A64]"
                                : "text-[#64748B]"
                            }`}
                          >
                            {rule.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* CONFIRM PASSWORD */}
                <View className="mt-4">
                  <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                    Confirm password
                  </Text>

                  <TextInput
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);

                      if (error) {
                        setError(null);
                      }
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 text-sm text-[#132F57]"
                  />
                </View>

                {/* CREATE */}
                <Pressable
                  onPress={handleRegister}
                  disabled={loading}
                  className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl ${
                    loading ? "bg-[#FFB09E]" : "bg-[#FF5A3C] active:opacity-80"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <UserRoundPlus size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Create account
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* LOGIN */}
                <View className="mt-6 rounded-[20px] border border-[#EEF2F6] bg-[#F8FAFC] p-4">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3EE]">
                      <BadgeCheck size={18} color="#FF5A3C" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-[#132F57]">
                        Already have an account?
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Sign in with your existing Dwaar Sewa account.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => router.replace("/auth/login")}
                    disabled={loading}
                    className="mt-3 items-center rounded-2xl border border-[#FF5A3C] bg-white py-3.5 active:opacity-70"
                  >
                    <Text className="text-xs font-bold text-[#FF5A3C]">
                      Sign in
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-center">
                <ShieldCheck size={14} color="#94A3B8" />

                <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                  Secure customer registration
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
