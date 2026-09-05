import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

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
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
  XCircle,
} from "lucide-react-native";

import {
  getProviderRegistrationOptions,
  registerProvider,
} from "@/api/provider-auth";

import type { ProviderRegistrationCategory } from "@/types";

interface ApiErrorResponse {
  message?: string;
  field?: string;
  provider_id?: number;
  email?: string;
  email_verification_required?: boolean;
}

export default function ProviderRegisterScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [categories, setCategories] = useState<ProviderRegistrationCategory[]>(
    [],
  );

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [selectedExperienceByCategory, setSelectedExperienceByCategory] =
    useState<Record<number, number>>({});

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [optionsError, setOptionsError] = useState("");

  const [formError, setFormError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRegistrationOptions();
  }, []);

  const selectedCategoriesForExperience = useMemo(() => {
    return categories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .map((category) => ({
        ...category,
        experience_options: [...category.experience_options].sort(
          (first, second) =>
            first.display_order - second.display_order ||
            first.name.localeCompare(second.name),
        ),
      }));
  }, [categories, selectedCategoryIds]);

  async function loadRegistrationOptions() {
    try {
      setIsLoadingOptions(true);
      setOptionsError("");

      const data = await getProviderRegistrationOptions();

      setCategories(data.categories ?? []);
    } catch (error) {
      console.error("Load provider registration options error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setOptionsError(
          error.response?.data?.message ??
            "Unable to load provider registration options.",
        );
      } else {
        setOptionsError("Unable to load provider registration options.");
      }
    } finally {
      setIsLoadingOptions(false);
    }
  }

  function updateFieldError(field: string) {
    if (!fieldErrors[field]) {
      return;
    }

    setFieldErrors((current) => {
      const nextErrors = { ...current };

      delete nextErrors[field];

      return nextErrors;
    });
  }

  function toggleCategory(categoryId: number) {
    setFormError("");

    setSelectedCategoryIds((current) => {
      const isRemoving = current.includes(categoryId);

      const nextCategoryIds = isRemoving
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId];

      if (isRemoving) {
        setSelectedExperienceByCategory((currentMap) => {
          if (!(categoryId in currentMap)) {
            return currentMap;
          }

          const nextMap = {
            ...currentMap,
          };

          delete nextMap[categoryId];

          return nextMap;
        });
      }

      return nextCategoryIds;
    });

    updateFieldError("categoryIds");
  }

  function selectExperienceForCategory(
    categoryId: number,
    experienceId: number,
  ) {
    setFormError("");

    setSelectedExperienceByCategory((current) => ({
      ...current,
      [categoryId]: experienceId,
    }));

    updateFieldError("categoryExperience");
  }

  function validateForm(): boolean {
    const nextErrors: Record<string, string> = {};

    const normalizedName = fullName.trim();

    const normalizedPhone = phone.trim();

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedAddress = address.trim();

    if (!normalizedName) {
      nextErrors.fullName = "Full name is required";
    } else if (normalizedName.length < 2) {
      nextErrors.fullName = "Full name must contain at least 2 characters";
    }

    if (!normalizedPhone) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s]{7,20}$/.test(normalizedPhone)) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!normalizedAddress) {
      nextErrors.address = "Address is required";
    } else if (normalizedAddress.length < 5) {
      nextErrors.address = "Please enter a more complete address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Password confirmation does not match";
    }

    if (selectedCategoryIds.length === 0) {
      nextErrors.categoryIds = "Select at least one service category";
    } else {
      const missingExperienceCategories = selectedCategoryIds.filter(
        (categoryId) => !(categoryId in selectedExperienceByCategory),
      );

      if (missingExperienceCategories.length > 0) {
        nextErrors.categoryExperience =
          "Select an experience level for every category you've chosen";
      }
    }

    setFieldErrors(nextErrors);
    setFormError("");

    return Object.keys(nextErrors).length === 0;
  }

  async function handleRegister() {
    if (!validateForm() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      const normalizedEmail = email.trim().toLowerCase();

      await registerProvider({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        password,
        address: address.trim(),
        profilePhotoUrl: null,
        categoryIds: selectedCategoryIds,
        categoryExperience: Object.entries(selectedExperienceByCategory).map(
          ([categoryId, experienceTypeId]) => ({
            categoryId: Number(categoryId),
            experienceTypeId,
          }),
        ),
      });

      router.replace({
        pathname: "/provider/login",
        params: {
          registered: "1",
        },
      });
    } catch (error) {
      console.error("Provider registration error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        if (responseData?.field) {
          setFieldErrors((current) => ({
            ...current,
            [responseData.field as string]:
              responseData.message ?? "Please check this field",
          }));

          return;
        }

        setFormError(
          responseData?.message ?? "Unable to create the provider account.",
        );

        return;
      }

      setFormError("Something went wrong while creating the provider account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderInputError(field: string) {
    const message = fieldErrors[field];

    if (!message) {
      return null;
    }

    return (
      <View className="mt-2 flex-row items-start">
        <XCircle size={14} color="#DC2626" />

        <Text className="ml-1.5 flex-1 text-[11px] leading-5 text-[#DC2626]">
          {message}
        </Text>
      </View>
    );
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
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
            }}
            className="px-5 py-5"
          >
            {/* TOP BAR */}
            <View className="flex-row items-center justify-between">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-2xl border border-[#E7ECF2] bg-white active:opacity-70"
                onPress={() => router.back()}
                disabled={isSubmitting}
              >
                <ArrowLeft size={19} color="#132F57" />
              </Pressable>

              <Pressable
                onPress={() => router.replace("/provider/login")}
                disabled={isSubmitting}
                className="rounded-2xl border border-[#E7ECF2] bg-white px-4 py-3 active:opacity-70"
              >
                <Text className="text-xs font-bold text-[#475569]">
                  Sign in instead
                </Text>
              </Pressable>
            </View>

            {/* HEADER */}
            <View className="mt-5">
              <Text className="text-[11px] font-extrabold tracking-[1.2px] text-[#159A64]">
                JOIN DWAAR SEWA
              </Text>

              <Text
                className={`mt-1 font-extrabold text-[#132F57] ${
                  isTablet ? "text-[30px]" : "text-[26px]"
                }`}
              >
                Become a service provider
              </Text>

              <Text className="mt-1 max-w-[760px] text-sm leading-6 text-[#64748B]">
                Create your provider account, choose the services you offer and
                tell us your experience level for each category.
              </Text>
            </View>

            {/* HERO */}
            <View className="mt-5 rounded-[28px] bg-[#132F57] p-5">
              <View
                className={
                  isTablet ? "flex-row items-center justify-between" : ""
                }
              >
                <View className="flex-1">
                  <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-[#159A64]">
                    <UserRoundPlus size={24} color="#FFFFFF" />
                  </View>

                  <Text className="mt-4 text-xl font-extrabold text-white">
                    Build your provider profile
                  </Text>

                  <Text className="mt-1 max-w-[520px] text-xs leading-5 text-white/65">
                    Register once, complete your service information and
                    continue to the provider portal after registration.
                  </Text>
                </View>

                <View className={isTablet ? "w-[350px] ml-6" : "mt-5"}>
                  {[
                    {
                      icon: BriefcaseBusiness,
                      title: "Choose your categories",
                    },
                    {
                      icon: Sparkles,
                      title: "Set experience separately",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Admin verification",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <View
                        key={item.title}
                        className="mb-2 flex-row items-center rounded-[16px] bg-white/10 px-3.5 py-3"
                      >
                        <Icon size={15} color="#5DD39E" />

                        <Text className="ml-2 text-[10px] font-bold text-white">
                          {item.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {formError ? (
              <View className="mt-4 flex-row items-start rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                <XCircle size={17} color="#BE123C" />

                <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                  {formError}
                </Text>
              </View>
            ) : null}

            <View
              className={isDesktop ? "mt-5 flex-row gap-5 items-start" : "mt-5"}
            >
              {/* LEFT COLUMN */}
              <View
                style={{
                  flex: isDesktop ? 1 : undefined,
                }}
              >
                {/* ACCOUNT DETAILS */}
                <View className="rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF4FF]">
                      <UserRound size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Account information
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Your basic registration details
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Full name
                    </Text>

                    <TextInput
                      className={`h-14 rounded-2xl border px-4 text-sm text-[#132F57] ${
                        fieldErrors.fullName
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={fullName}
                      onChangeText={(value) => {
                        setFullName(value);
                        updateFieldError("fullName");
                      }}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                      editable={!isSubmitting}
                    />

                    {renderInputError("fullName")}
                  </View>

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
                        className={`h-14 rounded-2xl border py-3.5 pl-11 pr-4 text-sm text-[#132F57] ${
                          fieldErrors.phone
                            ? "border-[#FCA5A5] bg-[#FFF7F7]"
                            : "border-[#E2E8F0] bg-[#FAFBFC]"
                        }`}
                        value={phone}
                        onChangeText={(value) => {
                          setPhone(value);
                          updateFieldError("phone");
                        }}
                        placeholder="98XXXXXXXX"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        editable={!isSubmitting}
                      />
                    </View>

                    {renderInputError("phone")}
                  </View>

                  <View className="mt-4">
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
                          fieldErrors.email
                            ? "border-[#FCA5A5] bg-[#FFF7F7]"
                            : "border-[#E2E8F0] bg-[#FAFBFC]"
                        }`}
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);
                          updateFieldError("email");
                        }}
                        placeholder="provider@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                      />
                    </View>

                    {renderInputError("email")}
                  </View>

                  <View className="mt-4">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Address
                    </Text>

                    <View className="relative">
                      <MapPin
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
                        className={`min-h-24 rounded-2xl border py-4 pl-11 pr-4 text-sm text-[#132F57] ${
                          fieldErrors.address
                            ? "border-[#FCA5A5] bg-[#FFF7F7]"
                            : "border-[#E2E8F0] bg-[#FAFBFC]"
                        }`}
                        value={address}
                        onChangeText={(value) => {
                          setAddress(value);
                          updateFieldError("address");
                        }}
                        placeholder="Enter your complete address"
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        editable={!isSubmitting}
                      />
                    </View>

                    {renderInputError("address")}
                  </View>
                </View>

                {/* PASSWORD */}
                <View className="mt-4 rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF7E6]">
                      <LockKeyhole size={18} color="#B7791F" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Account security
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Create a secure password
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Password
                    </Text>

                    <View
                      className={`h-14 flex-row items-center rounded-2xl border px-4 ${
                        fieldErrors.password
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
                          updateFieldError("password");
                        }}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
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

                    {renderInputError("password")}
                  </View>

                  <View className="mt-4">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Confirm password
                    </Text>

                    <TextInput
                      className={`h-14 rounded-2xl border px-4 text-sm text-[#132F57] ${
                        fieldErrors.confirmPassword
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        updateFieldError("confirmPassword");
                      }}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />

                    {renderInputError("confirmPassword")}
                  </View>
                </View>
              </View>

              {/* RIGHT COLUMN */}
              <View
                style={{
                  width: isDesktop ? 430 : "100%",
                  marginTop: isDesktop ? 0 : 16,
                }}
              >
                {/* CATEGORIES */}
                <View className="rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF8F1]">
                      <BriefcaseBusiness size={18} color="#159A64" />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Service categories
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Select everything you can provide
                      </Text>
                    </View>

                    <View className="rounded-full bg-[#F5F7FA] px-3 py-1.5">
                      <Text className="text-[10px] font-extrabold text-[#64748B]">
                        {selectedCategoryIds.length} SELECTED
                      </Text>
                    </View>
                  </View>

                  {isLoadingOptions ? (
                    <View className="mt-6 items-center rounded-2xl bg-[#F8FAFC] py-8">
                      <ActivityIndicator color="#159A64" />

                      <Text className="mt-3 text-xs text-[#64748B]">
                        Loading categories...
                      </Text>
                    </View>
                  ) : optionsError ? (
                    <View className="mt-5 rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
                      <Text className="text-xs leading-5 text-[#BE123C]">
                        {optionsError}
                      </Text>

                      <Pressable
                        className="mt-3 self-start rounded-xl border border-[#FECDD3] bg-white px-4 py-2.5 active:opacity-70"
                        onPress={loadRegistrationOptions}
                      >
                        <Text className="text-xs font-bold text-[#BE123C]">
                          Try again
                        </Text>
                      </Pressable>
                    </View>
                  ) : categories.length === 0 ? (
                    <View className="mt-5 rounded-2xl bg-[#F8FAFC] p-4">
                      <Text className="text-xs text-[#64748B]">
                        No provider categories are currently available.
                      </Text>
                    </View>
                  ) : (
                    <View className="mt-5">
                      {categories.map((category) => {
                        const selected = selectedCategoryIds.includes(
                          category.id,
                        );

                        return (
                          <Pressable
                            key={category.id}
                            className={`mb-3 rounded-[20px] border p-4 ${
                              selected
                                ? "border-[#CDEBD9] bg-[#F2FBF7]"
                                : "border-[#E7ECF2] bg-[#FAFBFC]"
                            }`}
                            onPress={() => toggleCategory(category.id)}
                            disabled={isSubmitting}
                          >
                            <View className="flex-row items-start justify-between">
                              <View className="mr-4 flex-1">
                                <Text
                                  className={`text-sm font-extrabold ${
                                    selected
                                      ? "text-[#159A64]"
                                      : "text-[#132F57]"
                                  }`}
                                >
                                  {category.name}
                                </Text>

                                {category.description ? (
                                  <Text className="mt-1 text-[11px] leading-5 text-[#64748B]">
                                    {category.description}
                                  </Text>
                                ) : null}
                              </View>

                              <View
                                className={`h-7 w-7 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-[#159A64] bg-[#159A64]"
                                    : "border-[#CBD5E1] bg-white"
                                }`}
                              >
                                {selected ? (
                                  <Check size={14} color="#FFFFFF" />
                                ) : null}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {renderInputError("categoryIds")}
                </View>

                {/* EXPERIENCE */}
                <View className="mt-4 rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F3F0FF]">
                      <Sparkles size={18} color="#6D44C5" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Experience
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Choose one level for each selected category
                      </Text>
                    </View>
                  </View>

                  {selectedCategoriesForExperience.length === 0 ? (
                    <View className="mt-5 rounded-2xl bg-[#F8FAFC] p-4">
                      <Text className="text-xs leading-5 text-[#64748B]">
                        Select a service category first.
                      </Text>
                    </View>
                  ) : (
                    selectedCategoriesForExperience.map((category) => (
                      <View key={category.id} className="mt-5">
                        <Text className="text-sm font-extrabold text-[#132F57]">
                          {category.name}
                        </Text>

                        {category.experience_options.length === 0 ? (
                          <View className="mt-2 rounded-2xl bg-[#F8FAFC] p-4">
                            <Text className="text-xs text-[#64748B]">
                              No experience options are available for this
                              category.
                            </Text>
                          </View>
                        ) : (
                          <View className="mt-3 flex-row flex-wrap">
                            {category.experience_options.map((experience) => {
                              const selected =
                                selectedExperienceByCategory[category.id] ===
                                experience.id;

                              return (
                                <Pressable
                                  key={`${category.id}-${experience.id}`}
                                  className={`mb-2 mr-2 rounded-full border px-4 py-3 ${
                                    selected
                                      ? "border-[#159A64] bg-[#159A64]"
                                      : "border-[#E2E8F0] bg-white"
                                  }`}
                                  onPress={() =>
                                    selectExperienceForCategory(
                                      category.id,
                                      experience.id,
                                    )
                                  }
                                  disabled={isSubmitting}
                                >
                                  <Text
                                    className={`text-xs font-bold ${
                                      selected ? "text-white" : "text-[#475569]"
                                    }`}
                                  >
                                    {experience.name}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))
                  )}

                  {renderInputError("categoryExperience")}
                </View>

                {/* APPROVAL INFO */}
                <View className="mt-4 rounded-[26px] border border-[#FDE7B1] bg-[#FFF7E6] p-5">
                  <View className="flex-row items-start">
                    <BadgeCheck size={18} color="#B7791F" />

                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-extrabold text-[#92400E]">
                        Admin approval required
                      </Text>

                      <Text className="mt-2 text-xs leading-5 text-[#92400E]">
                        After registration, your provider profile remains
                        pending until a Dwaar Sewa administrator reviews and
                        approves it.
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  className={`mt-4 h-14 flex-row items-center justify-center rounded-[20px] ${
                    isSubmitting || isLoadingOptions || Boolean(optionsError)
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
                  }`}
                  onPress={handleRegister}
                  disabled={
                    isSubmitting || isLoadingOptions || Boolean(optionsError)
                  }
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <UserRoundPlus size={17} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Create Provider Account
                      </Text>
                    </>
                  )}
                </Pressable>

                <View className="mt-4 flex-row items-center justify-center">
                  <ShieldCheck size={14} color="#94A3B8" />

                  <Text className="ml-1.5 text-[10px] text-[#94A3B8]">
                    Secure provider registration
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
