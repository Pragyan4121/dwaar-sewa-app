import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
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
  Camera,
  CheckCircle2,
  FileText,
  ImageIcon,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react-native";

import {
  updateMyProviderProfile,
  uploadProviderProfilePhoto,
  type UpdateProviderProfileInput,
} from "@/api/provider-profile";

import { useProviderAuth } from "@/context/ProviderAuthContext";

interface ApiErrorResponse {
  message?: string;
  field?: string;
}

export default function ProviderEditProfileScreen() {
  const {
    provider,
    isProviderLoading,
    isProviderAuthenticated,
    refreshProvider,
  } = useProviderAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!provider) {
      return;
    }

    setFullName(provider.full_name ?? "");
    setPhone(provider.phone ?? "");
    setAddress(provider.profile?.address ?? "");
    setBio(provider.profile?.bio ?? "");

    setYearsOfExperience(String(provider.profile?.years_of_experience ?? 0));

    setProfilePhotoUrl(provider.profile?.profile_photo_url ?? "");
  }, [provider]);

  function clearFieldError(field: string) {
    if (!fieldErrors[field]) {
      return;
    }

    setFieldErrors((current) => {
      const nextErrors = { ...current };

      delete nextErrors[field];

      return nextErrors;
    });
  }

  function validateForm(): boolean {
    const nextErrors: Record<string, string> = {};

    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedAddress = address.trim();
    const normalizedBio = bio.trim();

    if (!normalizedName) {
      nextErrors.fullName = "Full name is required";
    } else if (normalizedName.length < 2 || normalizedName.length > 100) {
      nextErrors.fullName =
        "Full name must contain between 2 and 100 characters";
    }

    if (!normalizedPhone) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s]{7,20}$/.test(normalizedPhone)) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (normalizedAddress.length > 500) {
      nextErrors.address = "Address must not exceed 500 characters";
    }

    if (normalizedBio.length > 1000) {
      nextErrors.bio = "Bio must not exceed 1000 characters";
    }

    const parsedYears = Number(yearsOfExperience);

    if (
      yearsOfExperience.trim() === "" ||
      !Number.isInteger(parsedYears) ||
      parsedYears < 0 ||
      parsedYears > 80
    ) {
      nextErrors.yearsOfExperience =
        "Years of experience must be between 0 and 80";
    }

    if (
      profilePhotoUrl.trim() &&
      !/^https?:\/\/.+/i.test(profilePhotoUrl.trim())
    ) {
      nextErrors.profilePhotoUrl =
        "Profile photo URL must be a valid http or https URL";
    }

    setFieldErrors(nextErrors);
    setFormError("");
    setSuccessMessage("");

    return Object.keys(nextErrors).length === 0;
  }

  async function pickAndUploadPhoto() {
    setPhotoError("");
    setFormError("");
    setSuccessMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPhotoError(
        "Photo library permission is required to choose a profile photo.",
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    try {
      setIsUploadingPhoto(true);

      const uploaded = await uploadProviderProfilePhoto({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });

      setProfilePhotoUrl(uploaded.file_url);
      clearFieldError("profilePhotoUrl");
      setSuccessMessage("Profile photo uploaded.");
    } catch (error) {
      console.error("Upload provider profile photo error:", error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setPhotoError(
          error.response?.data?.message ?? "Unable to upload the photo.",
        );

        return;
      }

      setPhotoError("Something went wrong while uploading the photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!validateForm() || isSubmitting) {
      return;
    }

    if (!provider) {
      setFormError("Provider profile is not available.");

      return;
    }

    const input: UpdateProviderProfileInput = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim() || null,
      bio: bio.trim() || null,
      yearsOfExperience: Number(yearsOfExperience),
      profilePhotoUrl: profilePhotoUrl.trim() || null,
    };

    try {
      setIsSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      await updateMyProviderProfile(input);

      const refreshedProvider = await refreshProvider();

      if (!refreshedProvider) {
        setFormError(
          "Profile was updated, but the refreshed profile could not be loaded.",
        );

        return;
      }

      setSuccessMessage("Provider profile updated successfully.");

      setTimeout(() => {
        router.replace("/provider/profile");
      }, 700);
    } catch (error) {
      console.error("Update provider profile error:", error);

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
          responseData?.message ?? "Unable to update the provider profile.",
        );

        return;
      }

      setFormError("Something went wrong while updating the provider profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(field: string) {
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

  if (isProviderLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <View className="h-16 w-16 items-center justify-center rounded-[22px] border border-[#E7ECF2] bg-white">
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
        <View className="w-full max-w-[460px] items-center rounded-[28px] border border-[#E7ECF2] bg-white p-7">
          <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-[#EAF8F1]">
            <UserRound size={28} color="#159A64" />
          </View>

          <Text className="mt-5 text-center text-xl font-extrabold text-[#132F57]">
            Provider login required
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-[#64748B]">
            Sign in to update your provider profile and professional details.
          </Text>

          <Pressable
            className="mt-6 w-full items-center rounded-2xl bg-[#159A64] py-4 active:opacity-80"
            onPress={() => router.replace("/provider/login")}
          >
            <Text className="font-bold text-white">Go to Provider Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = provider.full_name
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          >
            {/* HEADER */}
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between">
                <Pressable
                  className="h-11 w-11 items-center justify-center rounded-2xl border border-[#E7ECF2] bg-white active:opacity-70"
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={19} color="#132F57" />
                </Pressable>

                <Pressable
                  className="flex-row items-center rounded-2xl border border-[#E7ECF2] bg-white px-4 py-3 active:opacity-70"
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <X size={15} color="#64748B" />

                  <Text className="ml-2 text-xs font-bold text-[#475569]">
                    Cancel
                  </Text>
                </Pressable>
              </View>

              <View className="mt-5">
                <Text className="text-[11px] font-extrabold tracking-[1.2px] text-[#159A64]">
                  EDIT PROVIDER PROFILE
                </Text>

                <Text
                  className={`mt-1 font-extrabold text-[#132F57] ${
                    isTablet ? "text-[30px]" : "text-[26px]"
                  }`}
                >
                  Update your information
                </Text>

                <Text className="mt-1 text-sm text-[#64748B]">
                  Keep your personal and professional information accurate and
                  up to date.
                </Text>
              </View>
            </View>

            {/* HERO */}
            <View className="px-5 mt-5">
              <View className="rounded-[28px] bg-[#132F57] p-5">
                <View
                  className={
                    isTablet ? "flex-row items-center justify-between" : ""
                  }
                >
                  <View className="flex-row items-center flex-1">
                    <View className="h-20 w-20 overflow-hidden rounded-[26px] border border-white/10 bg-white/10 items-center justify-center">
                      {profilePhotoUrl.trim() ? (
                        <Image
                          source={{
                            uri: profilePhotoUrl.trim(),
                          }}
                          className="h-20 w-20"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-2xl font-extrabold text-white">
                          {initials || "DS"}
                        </Text>
                      )}
                    </View>

                    <View className="ml-4 flex-1">
                      <Text className="text-white text-xl font-extrabold">
                        {fullName || provider.full_name}
                      </Text>

                      <Text className="mt-1 text-xs text-white/60">
                        {provider.email ?? "No email address"}
                      </Text>

                      <View className="mt-3 self-start flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                        <ShieldCheck size={13} color="#5DD39E" />

                        <Text className="ml-1.5 text-[10px] font-extrabold text-white">
                          PROFESSIONAL PROFILE
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className={isTablet ? "w-[300px] ml-6" : "mt-5"}>
                    <View className="rounded-[20px] bg-white/10 p-4">
                      <Text className="text-white text-xs font-bold">
                        Keep your profile current
                      </Text>

                      <Text className="mt-1 text-[10px] leading-5 text-white/65">
                        Accurate contact, address, experience and profile
                        details help customers trust your provider account.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* MESSAGES */}
            {formError ? (
              <View className="px-5 mt-4">
                <View className="flex-row items-start rounded-[20px] border border-[#FECDD3] bg-[#FFF1F2] p-4">
                  <XCircle size={17} color="#BE123C" />

                  <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-[#BE123C]">
                    {formError}
                  </Text>
                </View>
              </View>
            ) : null}

            {successMessage ? (
              <View className="px-5 mt-4">
                <View className="flex-row items-center rounded-[20px] border border-[#CDEBD9] bg-[#EAF8F1] p-4">
                  <BadgeCheck size={17} color="#159A64" />

                  <Text className="ml-2 flex-1 text-xs font-semibold text-[#159A64]">
                    {successMessage}
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              className={
                isDesktop ? "flex-row px-5 mt-5 gap-5 items-start" : "px-5 mt-5"
              }
            >
              {/* LEFT COLUMN */}
              <View
                style={{
                  flex: isDesktop ? 1 : undefined,
                }}
              >
                {/* PHOTO */}
                <View className="rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF3EE]">
                      <Camera size={18} color="#FF5A3C" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Profile photo
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Choose a clear professional photo
                      </Text>
                    </View>
                  </View>

                  <View
                    className={
                      isTablet
                        ? "mt-5 flex-row items-center"
                        : "mt-5 items-center"
                    }
                  >
                    <View className="h-28 w-28 overflow-hidden rounded-[30px] border border-[#E7ECF2] bg-[#F5F7FA] items-center justify-center">
                      {profilePhotoUrl.trim() ? (
                        <Image
                          source={{
                            uri: profilePhotoUrl.trim(),
                          }}
                          className="h-28 w-28"
                          resizeMode="cover"
                        />
                      ) : (
                        <ImageIcon size={30} color="#94A3B8" />
                      )}
                    </View>

                    <View className={isTablet ? "ml-5 flex-1" : "mt-4 w-full"}>
                      <Pressable
                        className={`items-center justify-center rounded-2xl border py-3.5 ${
                          isUploadingPhoto
                            ? "border-[#CDEBD9] bg-[#EAF8F1]"
                            : "border-[#159A64] bg-white active:opacity-70"
                        }`}
                        onPress={pickAndUploadPhoto}
                        disabled={isUploadingPhoto || isSubmitting}
                      >
                        {isUploadingPhoto ? (
                          <ActivityIndicator color="#159A64" size="small" />
                        ) : (
                          <View className="flex-row items-center">
                            <Camera size={15} color="#159A64" />

                            <Text className="ml-2 text-xs font-bold text-[#159A64]">
                              Choose photo from device
                            </Text>
                          </View>
                        )}
                      </Pressable>

                      {photoError ? (
                        <View className="mt-3 flex-row items-start">
                          <XCircle size={14} color="#DC2626" />

                          <Text className="ml-1.5 flex-1 text-[11px] leading-5 text-[#DC2626]">
                            {photoError}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Profile photo URL
                    </Text>

                    <TextInput
                      className={`rounded-2xl border px-4 py-3.5 text-sm text-[#132F57] ${
                        fieldErrors.profilePhotoUrl
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={profilePhotoUrl}
                      onChangeText={(value) => {
                        setProfilePhotoUrl(value);
                        clearFieldError("profilePhotoUrl");
                        setFormError("");
                        setSuccessMessage("");
                      }}
                      placeholder="https://example.com/photo.jpg"
                      placeholderTextColor="#94A3B8"
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting && !isUploadingPhoto}
                    />

                    {renderFieldError("profilePhotoUrl")}

                    <Text className="mt-2 text-[10px] leading-5 text-[#64748B]">
                      You can upload a photo from your device or paste a direct
                      image URL.
                    </Text>
                  </View>
                </View>

                {/* PERSONAL INFO */}
                <View className="mt-4 rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF4FF]">
                      <UserRound size={18} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Personal information
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Basic contact details
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Full name
                    </Text>

                    <TextInput
                      className={`rounded-2xl border px-4 py-3.5 text-sm text-[#132F57] ${
                        fieldErrors.fullName
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={fullName}
                      onChangeText={(value) => {
                        setFullName(value);
                        clearFieldError("fullName");
                        setFormError("");
                        setSuccessMessage("");
                      }}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                      editable={!isSubmitting}
                    />

                    {renderFieldError("fullName")}
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
                          top: 17,
                          zIndex: 1,
                        }}
                      />

                      <TextInput
                        className={`rounded-2xl border py-3.5 pl-11 pr-4 text-sm text-[#132F57] ${
                          fieldErrors.phone
                            ? "border-[#FCA5A5] bg-[#FFF7F7]"
                            : "border-[#E2E8F0] bg-[#FAFBFC]"
                        }`}
                        value={phone}
                        onChangeText={(value) => {
                          setPhone(value);
                          clearFieldError("phone");
                          setFormError("");
                          setSuccessMessage("");
                        }}
                        placeholder="98XXXXXXXX"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        editable={!isSubmitting}
                      />
                    </View>

                    {renderFieldError("phone")}
                  </View>

                  <View className="mt-4">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Email address
                    </Text>

                    <View className="rounded-2xl border border-[#E7ECF2] bg-[#F5F7FA] px-4 py-3.5">
                      <Text className="text-sm text-[#64748B]">
                        {provider.email ?? "No email address"}
                      </Text>
                    </View>

                    <Text className="mt-2 text-[10px] leading-5 text-[#94A3B8]">
                      Email changes are not currently supported from this
                      screen.
                    </Text>
                  </View>
                </View>

                {/* PROFESSIONAL DETAILS */}
                <View className="mt-4 rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF8F1]">
                      <Sparkles size={18} color="#159A64" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-lg font-extrabold text-[#132F57]">
                        Professional details
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-[#64748B]">
                        Address, experience and provider bio
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5">
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
                          top: 16,
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
                          clearFieldError("address");
                          setFormError("");
                          setSuccessMessage("");
                        }}
                        placeholder="Enter your complete address"
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        editable={!isSubmitting}
                      />
                    </View>

                    <View className="mt-2 flex-row justify-between">
                      <View className="flex-1">
                        {renderFieldError("address")}
                      </View>

                      <Text className="ml-3 text-[10px] text-[#94A3B8]">
                        {address.trim().length}/500
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Professional bio
                    </Text>

                    <View className="relative">
                      <FileText
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
                        className={`min-h-32 rounded-2xl border py-4 pl-11 pr-4 text-sm text-[#132F57] ${
                          fieldErrors.bio
                            ? "border-[#FCA5A5] bg-[#FFF7F7]"
                            : "border-[#E2E8F0] bg-[#FAFBFC]"
                        }`}
                        value={bio}
                        onChangeText={(value) => {
                          setBio(value);
                          clearFieldError("bio");
                          setFormError("");
                          setSuccessMessage("");
                        }}
                        placeholder="Tell customers about your experience and skills"
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        editable={!isSubmitting}
                      />
                    </View>

                    <View className="mt-2 flex-row justify-between">
                      <View className="flex-1">{renderFieldError("bio")}</View>

                      <Text className="ml-3 text-[10px] text-[#94A3B8]">
                        {bio.trim().length}/1000
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="mb-1.5 text-xs font-semibold text-[#132F57]">
                      Years of experience
                    </Text>

                    <TextInput
                      className={`rounded-2xl border px-4 py-3.5 text-sm text-[#132F57] ${
                        fieldErrors.yearsOfExperience
                          ? "border-[#FCA5A5] bg-[#FFF7F7]"
                          : "border-[#E2E8F0] bg-[#FAFBFC]"
                      }`}
                      value={yearsOfExperience}
                      onChangeText={(value) => {
                        const numericValue = value.replace(/\D/g, "");

                        setYearsOfExperience(numericValue.slice(0, 2));

                        clearFieldError("yearsOfExperience");

                        setFormError("");
                        setSuccessMessage("");
                      }}
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />

                    {renderFieldError("yearsOfExperience")}
                  </View>
                </View>
              </View>

              {/* RIGHT COLUMN */}
              <View
                style={{
                  width: isDesktop ? 360 : "100%",
                  marginTop: isDesktop ? 0 : 16,
                }}
              >
                <View className="rounded-[26px] border border-[#E7ECF2] bg-white p-5">
                  <Text className="text-lg font-extrabold text-[#132F57]">
                    Before you save
                  </Text>

                  <Text className="mt-1 text-[10px] text-[#64748B]">
                    Quick profile checklist
                  </Text>

                  {[
                    "Use your correct full name and reachable phone number.",
                    "Keep your service address accurate.",
                    "Write a clear, professional bio for customers.",
                    "Use a recent profile photo where possible.",
                  ].map((item) => (
                    <View key={item} className="mt-4 flex-row items-start">
                      <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-[#EAF8F1]">
                        <CheckCircle2 size={11} color="#159A64" />
                      </View>

                      <Text className="ml-2 flex-1 text-[11px] leading-5 text-[#64748B]">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-4 rounded-[26px] border border-[#FDE7B1] bg-[#FFF7E6] p-5">
                  <View className="flex-row items-start">
                    <ShieldCheck size={18} color="#B7791F" />

                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-extrabold text-[#92400E]">
                        Verification notice
                      </Text>

                      <Text className="mt-2 text-xs leading-5 text-[#92400E]">
                        Changing profile information may require another
                        administrator review depending on your provider
                        verification status.
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-4 rounded-[26px] bg-[#132F57] p-5">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <BadgeCheck size={20} color="#5DD39E" />
                  </View>

                  <Text className="mt-4 text-base font-extrabold text-white">
                    Professional profiles build trust
                  </Text>

                  <Text className="mt-1 text-xs leading-5 text-white/65">
                    Customers are more confident when provider details are
                    clear, current and complete.
                  </Text>
                </View>

                <Pressable
                  className={`mt-4 flex-row items-center justify-center rounded-[20px] py-4 ${
                    isSubmitting
                      ? "bg-[#86D9B2]"
                      : "bg-[#159A64] active:opacity-80"
                  }`}
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" />

                      <Text className="ml-2 text-sm font-bold text-white">
                        Save profile changes
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  className="mt-3 flex-row items-center justify-center rounded-[20px] border border-[#E2E8F0] bg-white py-4 active:opacity-70"
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <X size={15} color="#64748B" />

                  <Text className="ml-2 text-sm font-bold text-[#475569]">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
