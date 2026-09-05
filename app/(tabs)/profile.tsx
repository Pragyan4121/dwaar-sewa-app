import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";

import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Address } from "@/types";

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newFullAddress, setNewFullAddress] = useState("");
  const [newServiceArea, setNewServiceArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [busyAddressId, setBusyAddressId] = useState<number | null>(null);

  const loadAddresses = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    setLoadingAddresses(true);

    api
      .get<{ addresses: Address[] }>("/customer/addresses")
      .then(({ data }) => setAddresses(data.addresses))
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses]),
  );

  async function saveProfile() {
    setProfileError(null);
    setSavingProfile(true);

    try {
      await api.patch("/users/me", {
        fullName,
        email: email || undefined,
      });

      setIsEditing(false);
    } catch (err: any) {
      setProfileError(
        err?.response?.data?.message ?? "Couldn't update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function addAddress() {
    if (!newLabel || !newFullAddress || !newServiceArea) {
      setAddressError("Label, address, and area are required.");
      return;
    }

    setAddressError(null);
    setAddingAddress(true);

    try {
      const { data } = await api.post<{
        address: Address;
      }>("/customer/addresses", {
        label: newLabel,
        fullAddress: newFullAddress,
        serviceArea: newServiceArea,
        landmark: newLandmark || undefined,
      });

      setAddresses((previous) => [...previous, data.address]);

      setNewLabel("");
      setNewFullAddress("");
      setNewServiceArea("");
      setNewLandmark("");
      setShowAddForm(false);
    } catch (err: any) {
      setAddressError(err?.response?.data?.message ?? "Couldn't add address.");
    } finally {
      setAddingAddress(false);
    }
  }

  async function setDefaultAddress(id: number) {
    setBusyAddressId(id);

    try {
      await api.patch(`/customer/addresses/${id}/default`, {});

      setAddresses((previous) =>
        previous.map((address) => ({
          ...address,
          is_default: address.id === id,
        })),
      );
    } catch {
      // Existing behavior preserved.
    } finally {
      setBusyAddressId(null);
    }
  }

  async function deleteAddress(id: number) {
    setBusyAddressId(id);

    try {
      await api.delete(`/customer/addresses/${id}`);

      setAddresses((previous) =>
        previous.filter((address) => address.id !== id),
      );
    } catch {
      // Existing behavior preserved.
    } finally {
      setBusyAddressId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 34,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
              flex: 1,
            }}
            className="px-5 pt-5"
          >
            <View>
              <Text className="text-[27px] font-extrabold text-[#132F57]">
                Profile
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                Sign in to manage your Dwaar Sewa account
              </Text>
            </View>

            <View
              className="flex-1 justify-center"
              style={{
                paddingVertical: 40,
              }}
            >
              <View
                style={{
                  width: "100%",
                  maxWidth: 620,
                  alignSelf: "center",
                }}
              >
                <View className="overflow-hidden rounded-[30px] bg-[#132F57] p-6">
                  <View className="items-center">
                    <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-white/10">
                      <UserRound size={34} color="#FFFFFF" />
                    </View>

                    <Text className="mt-5 text-center text-[24px] font-extrabold text-white">
                      You&apos;re not signed in
                    </Text>

                    <Text className="mt-2 max-w-[430px] text-center text-sm leading-6 text-white/65">
                      Sign in to manage your profile, saved addresses and
                      service bookings.
                    </Text>
                  </View>

                  <View className="mt-7 gap-3">
                    <View className="flex-row items-center rounded-[18px] bg-white/10 px-4 py-3.5">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <ShieldCheck size={18} color="#FFB199" />
                      </View>

                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-extrabold text-white">
                          Secure account access
                        </Text>

                        <Text className="mt-0.5 text-[10px] leading-5 text-white/60">
                          Keep your bookings and personal information in one
                          place.
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center rounded-[18px] bg-white/10 px-4 py-3.5">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <MapPin size={18} color="#FFB199" />
                      </View>

                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-extrabold text-white">
                          Save your addresses
                        </Text>

                        <Text className="mt-0.5 text-[10px] leading-5 text-white/60">
                          Save home or office addresses for faster future
                          bookings.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="mt-4 rounded-[28px] border border-[#E7ECF2] bg-white p-5">
                  <Pressable
                    onPress={() => router.push("/auth/login")}
                    className="h-14 flex-row items-center justify-center rounded-2xl bg-[#FF5A3C] active:opacity-80"
                  >
                    <UserRound size={17} color="#FFFFFF" />

                    <Text className="ml-2 text-sm font-bold text-white">
                      Sign in
                    </Text>
                  </Pressable>

                  <View className="my-5 flex-row items-center">
                    <View className="h-px flex-1 bg-[#E7ECF2]" />

                    <Text className="mx-3 text-[10px] font-semibold text-[#94A3B8]">
                      NEW TO DWAAR SEWA?
                    </Text>

                    <View className="h-px flex-1 bg-[#E7ECF2]" />
                  </View>

                  <Pressable
                    onPress={() => router.push("/auth/choose-role")}
                    className="h-14 flex-row items-center justify-center rounded-2xl border border-[#FF5A3C] bg-white active:opacity-70"
                  >
                    <Plus size={17} color="#FF5A3C" />

                    <Text className="ml-2 text-sm font-bold text-[#FF5A3C]">
                      Create a new account
                    </Text>
                  </Pressable>

                  <Text className="mt-4 text-center text-[10px] leading-5 text-[#94A3B8]">
                    Join as a customer or service provider.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "DS";

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 34,
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
          <View className="px-5 pt-3">
            <Text className="text-secondary text-[27px] font-extrabold">
              Profile
            </Text>

            <Text className="text-muted text-sm mt-1">
              Manage your account and saved addresses
            </Text>
          </View>

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
              {/* PROFILE HERO */}
              <View className="bg-[#132F57] rounded-[28px] p-5 overflow-hidden">
                <View className="flex-row items-center">
                  <View className="w-16 h-16 rounded-[22px] bg-white/10 border border-white/10 items-center justify-center">
                    <Text className="text-white text-xl font-extrabold">
                      {initials}
                    </Text>
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="text-white text-xl font-extrabold">
                      {user?.full_name}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <ShieldCheck size={14} color="#5DD39E" />

                      <Text className="text-white/70 text-[11px] font-semibold ml-1.5">
                        Dwaar Sewa customer
                      </Text>
                    </View>
                  </View>

                  {!isEditing && (
                    <Pressable
                      onPress={() => setIsEditing(true)}
                      className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center active:opacity-70"
                    >
                      <Pencil size={17} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>

                {!isEditing && (
                  <View
                    className={isTablet ? "flex-row gap-3 mt-5" : "gap-3 mt-5"}
                  >
                    {user?.phone ? (
                      <View
                        className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center"
                        style={{
                          flex: isTablet ? 1 : undefined,
                        }}
                      >
                        <Phone size={16} color="#FFFFFF" />

                        <View className="ml-2.5">
                          <Text className="text-white/50 text-[9px] font-bold">
                            PHONE
                          </Text>

                          <Text className="text-white text-xs font-semibold mt-0.5">
                            {user.phone}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {user?.email ? (
                      <View
                        className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center"
                        style={{
                          flex: isTablet ? 1 : undefined,
                        }}
                      >
                        <Mail size={16} color="#FFFFFF" />

                        <View className="ml-2.5 flex-1">
                          <Text className="text-white/50 text-[9px] font-bold">
                            EMAIL
                          </Text>

                          <Text
                            className="text-white text-xs font-semibold mt-0.5"
                            numberOfLines={1}
                          >
                            {user.email}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>

              {/* EDIT PROFILE */}
              {isEditing && (
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
                  <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
                        <UserRound size={18} color="#3563E9" />
                      </View>

                      <View className="ml-3">
                        <Text className="text-secondary text-sm font-extrabold">
                          Edit profile
                        </Text>

                        <Text className="text-muted text-[10px] mt-0.5">
                          Update your personal details
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => {
                        setIsEditing(false);
                        setFullName(user?.full_name ?? "");
                        setEmail(user?.email ?? "");
                        setProfileError(null);
                      }}
                      className="w-9 h-9 rounded-xl bg-[#F5F7FA] items-center justify-center"
                    >
                      <X size={17} color="#64748B" />
                    </Pressable>
                  </View>

                  <Text className="text-secondary text-xs font-semibold mb-1.5">
                    Full name
                  </Text>

                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    placeholderTextColor="#94A3B8"
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary"
                  />

                  <Text className="text-secondary text-xs font-semibold mb-1.5">
                    Email
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Optional email address"
                    placeholderTextColor="#94A3B8"
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-secondary"
                  />

                  {profileError && (
                    <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl px-4 py-3 mt-3">
                      <Text className="text-[#BE123C] text-xs font-semibold">
                        {profileError}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={saveProfile}
                    disabled={savingProfile}
                    className={`rounded-2xl py-4 items-center mt-4 ${
                      savingProfile
                        ? "bg-primary/70"
                        : "bg-primary active:opacity-80"
                    }`}
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center">
                        <Check size={16} color="#FFFFFF" />

                        <Text className="text-white text-sm font-bold ml-2">
                          Save changes
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              )}

              {/* ADDRESS SECTION */}
              <View className="mt-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-secondary text-xl font-extrabold">
                      Saved addresses
                    </Text>

                    <Text className="text-muted text-xs mt-1">
                      Used for faster bookings
                    </Text>
                  </View>

                  {!showAddForm && (
                    <Pressable
                      onPress={() => {
                        setAddressError(null);
                        setShowAddForm(true);
                      }}
                      className="flex-row items-center bg-[#FFF3EE] px-3.5 py-2.5 rounded-xl active:opacity-70"
                    >
                      <Plus size={15} color="#FF5A3C" />

                      <Text className="text-primary text-xs font-bold ml-1.5">
                        Add address
                      </Text>
                    </Pressable>
                  )}
                </View>

                {loadingAddresses && (
                  <View className="bg-white border border-[#E7ECF2] rounded-[24px] py-10 items-center">
                    <ActivityIndicator color="#FF5A3C" />

                    <Text className="text-muted text-xs mt-3">
                      Loading addresses...
                    </Text>
                  </View>
                )}

                {!loadingAddresses &&
                  addresses.map((address) => (
                    <View
                      key={address.id}
                      className={`bg-white border rounded-[24px] p-4 mb-3 ${
                        address.is_default
                          ? "border-[#FFD7C9]"
                          : "border-[#E7ECF2]"
                      }`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-row items-start flex-1 pr-3">
                          <View
                            className={`w-11 h-11 rounded-2xl items-center justify-center ${
                              address.is_default
                                ? "bg-[#FFF3EE]"
                                : "bg-[#F5F7FA]"
                            }`}
                          >
                            <MapPin
                              size={19}
                              color={address.is_default ? "#FF5A3C" : "#64748B"}
                            />
                          </View>

                          <View className="flex-1 ml-3">
                            <View className="flex-row items-center">
                              <Text className="text-secondary text-sm font-extrabold">
                                {address.label}
                              </Text>

                              {address.is_default && (
                                <View className="flex-row items-center bg-[#FFF3EE] rounded-full px-2 py-1 ml-2">
                                  <Star
                                    size={10}
                                    color="#FF5A3C"
                                    fill="#FF5A3C"
                                  />

                                  <Text className="text-primary text-[9px] font-bold ml-1">
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text className="text-secondary text-xs leading-5 mt-1.5">
                              {address.full_address}
                            </Text>

                            <Text className="text-muted text-[11px] mt-0.5">
                              {address.service_area}
                            </Text>

                            {address.landmark && (
                              <Text className="text-muted text-[10px] mt-1">
                                Landmark: {address.landmark}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-end mt-4 pt-3 border-t border-[#EEF2F6]">
                        {!address.is_default && (
                          <Pressable
                            onPress={() => void setDefaultAddress(address.id)}
                            disabled={busyAddressId === address.id}
                            className="px-3 py-2 rounded-xl bg-[#F5F7FA] mr-2 active:opacity-70"
                          >
                            {busyAddressId === address.id ? (
                              <ActivityIndicator size="small" color="#FF5A3C" />
                            ) : (
                              <Text className="text-secondary text-[11px] font-bold">
                                Set default
                              </Text>
                            )}
                          </Pressable>
                        )}

                        <Pressable
                          onPress={() => void deleteAddress(address.id)}
                          disabled={busyAddressId === address.id}
                          className="w-9 h-9 rounded-xl bg-[#FFF1F2] items-center justify-center active:opacity-70"
                        >
                          {busyAddressId === address.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <Trash2 size={15} color="#DC2626" />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ))}

                {!loadingAddresses &&
                  addresses.length === 0 &&
                  !showAddForm && (
                    <View className="bg-white border border-[#E7ECF2] rounded-[24px] px-5 py-10 items-center">
                      <View className="w-16 h-16 rounded-[22px] bg-[#FFF3EE] items-center justify-center">
                        <MapPin size={26} color="#FF5A3C" />
                      </View>

                      <Text className="text-secondary text-base font-extrabold mt-4">
                        No saved addresses
                      </Text>

                      <Text className="text-muted text-xs text-center leading-5 mt-1 max-w-[280px]">
                        Add your home or office to make future bookings faster.
                      </Text>

                      <Pressable
                        onPress={() => setShowAddForm(true)}
                        className="bg-primary rounded-2xl px-5 py-3.5 mt-5 flex-row items-center active:opacity-80"
                      >
                        <Plus size={15} color="#FFFFFF" />

                        <Text className="text-white text-xs font-bold ml-1.5">
                          Add your first address
                        </Text>
                      </Pressable>
                    </View>
                  )}

                {showAddForm && (
                  <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mb-4">
                    <View className="flex-row items-center justify-between mb-5">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-2xl bg-[#FFF3EE] items-center justify-center">
                          <MapPin size={18} color="#FF5A3C" />
                        </View>

                        <View className="ml-3">
                          <Text className="text-secondary text-sm font-extrabold">
                            New address
                          </Text>

                          <Text className="text-muted text-[10px] mt-0.5">
                            Add a place you use often
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => {
                          setShowAddForm(false);
                          setAddressError(null);
                        }}
                        className="w-9 h-9 rounded-xl bg-[#F5F7FA] items-center justify-center"
                      >
                        <X size={17} color="#64748B" />
                      </Pressable>
                    </View>

                    <Text className="text-secondary text-xs font-semibold mb-1.5">
                      Label
                    </Text>

                    <TextInput
                      value={newLabel}
                      onChangeText={setNewLabel}
                      placeholder="Home, Office, etc."
                      placeholderTextColor="#94A3B8"
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary text-sm"
                    />

                    <Text className="text-secondary text-xs font-semibold mb-1.5">
                      Full address
                    </Text>

                    <TextInput
                      value={newFullAddress}
                      onChangeText={setNewFullAddress}
                      placeholder="House no, street"
                      placeholderTextColor="#94A3B8"
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary text-sm"
                    />

                    <Text className="text-secondary text-xs font-semibold mb-1.5">
                      Area / locality
                    </Text>

                    <TextInput
                      value={newServiceArea}
                      onChangeText={setNewServiceArea}
                      placeholder="e.g. Bharatpur, Chitwan"
                      placeholderTextColor="#94A3B8"
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary text-sm"
                    />

                    <Text className="text-secondary text-xs font-semibold mb-1.5">
                      Landmark{" "}
                      <Text className="text-muted font-medium">(optional)</Text>
                    </Text>

                    <TextInput
                      value={newLandmark}
                      onChangeText={setNewLandmark}
                      placeholder="Nearby landmark"
                      placeholderTextColor="#94A3B8"
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-secondary text-sm"
                    />

                    {addressError && (
                      <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl px-4 py-3 mt-3">
                        <Text className="text-[#BE123C] text-xs font-semibold">
                          {addressError}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      onPress={addAddress}
                      disabled={addingAddress}
                      className={`rounded-2xl py-4 items-center flex-row justify-center mt-4 ${
                        addingAddress
                          ? "bg-primary/70"
                          : "bg-primary active:opacity-80"
                      }`}
                    >
                      {addingAddress ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Check size={16} color="#FFFFFF" />

                          <Text className="text-white font-bold text-sm ml-2">
                            Save address
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT COLUMN */}
            <View
              style={{
                width: isDesktop ? 360 : "100%",
                marginTop: isDesktop ? 0 : 20,
              }}
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <Text className="text-secondary text-sm font-extrabold">
                  Account
                </Text>

                <Text className="text-muted text-[10px] mt-1">
                  Quick account actions
                </Text>

                <Pressable
                  onPress={() => router.push("/(tabs)/bookings")}
                  className="flex-row items-center justify-between bg-[#F8FAFC] border border-[#EEF2F6] rounded-2xl px-4 py-4 mt-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <ShieldCheck size={17} color="#3563E9" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-secondary text-xs font-bold">
                        My bookings
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        View service history
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#94A3B8" />
                </Pressable>

                <Pressable
                  onPress={() => void logout()}
                  className="flex-row items-center justify-between bg-[#FFF7F7] border border-[#FECACA] rounded-2xl px-4 py-4 mt-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-[#FEE2E2] items-center justify-center">
                      <LogOut size={17} color="#DC2626" />
                    </View>

                    <View className="ml-3">
                      <Text className="text-[#991B1B] text-xs font-bold">
                        Log out
                      </Text>

                      <Text className="text-[#B91C1C] text-[10px] mt-0.5">
                        Sign out of this account
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={17} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
