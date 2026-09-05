import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Wallet,
} from "lucide-react-native";

import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Address, Service } from "@/types";

function formatDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${period}`;
}

const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);

  return {
    value: formatDateValue(d),
    label: formatDateLabel(d),
  };
});

const TIME_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const hour = 8 + i;

  return {
    value: `${String(hour).padStart(2, "0")}:00`,
    label: formatHourLabel(hour),
  };
});

const NEW_ADDRESS = "new" as const;

const PAYMENT_METHOD_OPTIONS = [
  {
    value: "cash",
    label: "Cash",
    helper: "Pay the provider in person",
  },
  {
    value: "esewa",
    label: "eSewa",
    helper: "Pay online via eSewa",
  },
  {
    value: "khalti",
    label: "Khalti",
    helper: "Pay online via Khalti",
  },
  {
    value: "connectips",
    label: "Connect IPS",
    helper: "Pay online via Connect IPS",
  },
] as const;

type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"];

type ServiceWithImage = Service & {
  image_url?: string | null;
};

function getServiceImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return null;
  }

  const backendBaseUrl = rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "");

  return `${backendBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function getServiceEmoji(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("electric") || normalized.includes("wiring")) {
    return "⚡";
  }

  if (normalized.includes("plumb") || normalized.includes("water")) {
    return "🔧";
  }

  if (normalized.includes("clean") || normalized.includes("maid")) {
    return "🧹";
  }

  if (normalized.includes("ac") || normalized.includes("air condition")) {
    return "❄️";
  }

  if (normalized.includes("paint") || normalized.includes("color")) {
    return "🎨";
  }

  if (normalized.includes("carpenter") || normalized.includes("wood")) {
    return "🪚";
  }

  if (normalized.includes("repair") || normalized.includes("maintenance")) {
    return "🛠️";
  }

  return "🧰";
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [service, setService] = useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showBookingForm, setShowBookingForm] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [selectedAddressChoice, setSelectedAddressChoice] = useState<
    number | typeof NEW_ADDRESS
  >(NEW_ADDRESS);

  const [newLabel, setNewLabel] = useState("");
  const [newFullAddress, setNewFullAddress] = useState("");
  const [newServiceArea, setNewServiceArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");

  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [preferredDate, setPreferredDate] = useState(DATE_OPTIONS[0].value);

  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodValue>("cash");
  const [promoCode, setPromoCode] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [bookingError, setBookingError] = useState<string | null>(null);

  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    api
      .get<{ service: Service }>(`/services/${id}`)
      .then(({ data }) => setService(data.service))
      .catch(() => setError("Couldn't load this service."))
      .finally(() => setLoading(false));
  }, [id]);

  function loadAddresses() {
    if (!isAuthenticated) {
      return;
    }

    setLoadingAddresses(true);

    api
      .get<{ addresses: Address[] }>("/customer/addresses")
      .then(({ data }) => {
        setAddresses(data.addresses);

        const defaultAddress = data.addresses.find(
          (address) => address.is_default,
        );

        if (defaultAddress) {
          setSelectedAddressChoice(defaultAddress.id);
        } else if (data.addresses.length > 0) {
          setSelectedAddressChoice(data.addresses[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }

  function handleBookNowPress() {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setShowBookingForm(true);
    loadAddresses();
  }

  async function submitBooking() {
    let serviceAddress = "";
    let serviceArea = "";

    const usingSavedAddress = selectedAddressChoice !== NEW_ADDRESS;

    if (usingSavedAddress) {
      const chosen = addresses.find(
        (address) => address.id === selectedAddressChoice,
      );

      if (!chosen) {
        setBookingError("Please select an address.");
        return;
      }

      serviceAddress = chosen.full_address;
      serviceArea = chosen.service_area;
    } else {
      if (!newFullAddress || !newServiceArea) {
        setBookingError("Address and area are required.");
        return;
      }

      serviceAddress = newFullAddress;
      serviceArea = newServiceArea;
    }

    if (!preferredDate) {
      setBookingError("Please select a preferred date.");
      return;
    }

    setBookingError(null);
    setSubmitting(true);

    try {
      if (!usingSavedAddress && saveNewAddress && newLabel) {
        try {
          await api.post("/customer/addresses", {
            label: newLabel,
            fullAddress: newFullAddress,
            serviceArea: newServiceArea,
            landmark: newLandmark || undefined,
          });
        } catch {
          // Non-fatal — booking should still proceed
          // even if saving the address fails.
        }
      }

      await api.post("/bookings", {
        serviceId: Number(id),
        serviceAddress,
        serviceArea,
        preferredDate,
        preferredTime: preferredTime ?? undefined,
        notes: notes || undefined,
        paymentMethod,
        promoCode: promoCode.trim()
          ? promoCode.trim().toUpperCase()
          : undefined,
      });

      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(
        err?.response?.data?.message ??
          "Couldn't create booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator color="#FF5A3C" />
        </View>

        <Text className="text-muted text-xs mt-3">Loading service...</Text>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center px-6">
        <View className="w-16 h-16 rounded-[22px] bg-[#FFF3EE] items-center justify-center mb-4">
          <Text className="text-2xl">🛠️</Text>
        </View>

        <Text className="text-secondary text-lg font-extrabold">
          Service unavailable
        </Text>

        <Text className="text-muted text-sm text-center mt-2 max-w-[300px]">
          {error ?? "Service not found."}
        </Text>
      </View>
    );
  }

  if (bookingSuccess) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center px-6">
        <View className="w-full max-w-[470px] bg-white border border-[#E7ECF2] rounded-[30px] px-6 py-8 items-center">
          <View className="w-20 h-20 rounded-full bg-[#EAF8F1] items-center justify-center">
            <CheckCircle2 size={42} color="#159A64" />
          </View>

          <Text className="text-secondary text-2xl font-extrabold mt-5 text-center">
            Booking requested!
          </Text>

          <Text className="text-muted text-sm leading-6 text-center mt-2">
            We&apos;ll confirm your {service.name} booking shortly.
          </Text>

          <View className="w-full bg-[#F8FAFC] border border-[#E7ECF2] rounded-2xl px-4 py-4 mt-6">
            <View className="flex-row items-center">
              <Clock size={17} color="#64748B" />

              <Text className="text-secondary text-sm font-semibold ml-2">
                Track updates from My Bookings
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/bookings")}
            className="w-full bg-primary rounded-2xl py-4 items-center mt-5 active:opacity-80"
          >
            <Text className="text-white font-bold text-base">
              View my bookings
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const serviceWithImage = service as ServiceWithImage;

  const imageUrl = getServiceImageUrl(serviceWithImage.image_url);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F8FAFC]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          {/* HERO */}
          <View className={isTablet ? "px-5 pt-5" : ""}>
            <View
              className={`overflow-hidden ${isTablet ? "rounded-[30px]" : ""}`}
            >
              <View
                style={{
                  height: isDesktop ? 390 : isTablet ? 330 : 245,
                }}
                className="bg-[#EEF3F8] relative"
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="cover"
                    className="w-full h-full"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-[#EEF3F8]">
                    <View className="w-28 h-28 rounded-[34px] bg-white border border-[#DCE5ED] items-center justify-center">
                      <Text className="text-[52px]">
                        {getServiceEmoji(service.name)}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="absolute left-4 bottom-4 flex-row items-center bg-white/95 rounded-full px-3 py-2">
                  <ShieldCheck size={15} color="#159A64" />

                  <Text className="text-secondary text-[11px] font-bold ml-1.5">
                    Trusted Dwaar Sewa Service
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            className={
              isDesktop ? "flex-row px-5 mt-5 gap-5 items-start" : "px-5 mt-5"
            }
          >
            {/* MAIN COLUMN */}
            <View
              style={{
                flex: isDesktop ? 1 : undefined,
              }}
            >
              {/* SERVICE INFO */}
              <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                <View className="flex-row items-center self-start bg-[#F4F7FA] rounded-full px-3 py-1.5">
                  <Tag size={13} color="#64748B" />

                  <Text className="text-muted text-[11px] font-semibold ml-1.5">
                    {service.service_categories.name}
                  </Text>
                </View>

                <Text
                  className={`text-secondary font-extrabold mt-4 ${
                    isTablet ? "text-3xl leading-9" : "text-[26px] leading-8"
                  }`}
                >
                  {service.name}
                </Text>

                {service.description && (
                  <Text className="text-muted text-sm leading-6 mt-3">
                    {service.description}
                  </Text>
                )}

                <View className="flex-row flex-wrap mt-5 gap-10">
                  <View>
                    <Text className="text-muted text-[11px] font-medium">
                      Starting price
                    </Text>

                    <Text className="text-primary text-2xl font-extrabold mt-1">
                      ₹{service.base_price}
                    </Text>
                  </View>

                  {service.duration_minutes && (
                    <View>
                      <Text className="text-muted text-[11px] font-medium">
                        Estimated duration
                      </Text>

                      <View className="flex-row items-center mt-1.5">
                        <Clock size={16} color="#132F57" />

                        <Text className="text-secondary text-base font-bold ml-1.5">
                          {service.duration_minutes} mins
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* WHY BOOK */}
              {!showBookingForm && (
                <View className="bg-[#132F57] rounded-[26px] p-5 mt-4">
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                      <Sparkles size={20} color="#FFD166" />
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className="text-white text-base font-extrabold">
                        Easy, reliable booking
                      </Text>

                      <Text className="text-white/70 text-xs leading-5 mt-1">
                        Choose your address, date, preferred time and payment
                        method in just a few steps.
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5 gap-3">
                    <View className="flex-row items-center">
                      <CheckCircle2 size={17} color="#5DD39E" />

                      <Text className="text-white/90 text-xs font-semibold ml-2">
                        Verified local professionals
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <CheckCircle2 size={17} color="#5DD39E" />

                      <Text className="text-white/90 text-xs font-semibold ml-2">
                        Clear booking details before confirmation
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <CheckCircle2 size={17} color="#5DD39E" />

                      <Text className="text-white/90 text-xs font-semibold ml-2">
                        Track your booking status
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* BOOKING COLUMN */}
            <View
              style={{
                width: isDesktop ? 430 : "100%",
                marginTop: isDesktop ? 0 : 16,
              }}
            >
              {!showBookingForm ? (
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <Text className="text-secondary text-lg font-extrabold">
                    Ready to book?
                  </Text>

                  <Text className="text-muted text-xs leading-5 mt-1">
                    Reserve this service at a time and place that works for you.
                  </Text>

                  <Pressable
                    onPress={handleBookNowPress}
                    className="bg-primary rounded-2xl py-4 items-center mt-5 active:opacity-80"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-base">
                        Book now
                      </Text>

                      <ArrowRight
                        size={17}
                        color="#FFFFFF"
                        style={{
                          marginLeft: 7,
                        }}
                      />
                    </View>
                  </Pressable>

                  <View className="flex-row items-center justify-center mt-3">
                    <ShieldCheck size={13} color="#64748B" />

                    <Text className="text-muted text-[10px] ml-1.5">
                      Secure booking through Dwaar Sewa
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5">
                  <View className="mb-5">
                    <Text className="text-secondary text-xl font-extrabold">
                      Booking details
                    </Text>

                    <Text className="text-muted text-xs leading-5 mt-1">
                      Tell us where and when you need the service.
                    </Text>
                  </View>

                  {/* ADDRESS */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-xl bg-[#FFF3EE] items-center justify-center">
                      <MapPin size={17} color="#FF5A3C" />
                    </View>

                    <View className="ml-2.5">
                      <Text className="text-secondary text-sm font-extrabold">
                        Service address
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        Where should the provider come?
                      </Text>
                    </View>
                  </View>

                  {loadingAddresses && (
                    <View className="py-4">
                      <ActivityIndicator color="#FF5A3C" />
                    </View>
                  )}

                  {!loadingAddresses && addresses.length > 0 && (
                    <View className="mb-3">
                      {addresses.map((address) => {
                        const isSelected = selectedAddressChoice === address.id;

                        return (
                          <Pressable
                            key={address.id}
                            onPress={() => setSelectedAddressChoice(address.id)}
                            className={`border rounded-2xl px-4 py-3.5 mb-2 ${
                              isSelected
                                ? "border-primary bg-[#FFF8F5]"
                                : "border-[#E4EAF0] bg-[#FAFBFC]"
                            }`}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1 pr-3">
                                <Text className="text-secondary text-sm font-bold">
                                  {address.label}
                                </Text>

                                {address.is_default && (
                                  <Star
                                    size={12}
                                    color="#FF5A3C"
                                    fill="#FF5A3C"
                                    style={{
                                      marginLeft: 5,
                                    }}
                                  />
                                )}
                              </View>

                              {isSelected && (
                                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                                  <Check size={14} color="#FFFFFF" />
                                </View>
                              )}
                            </View>

                            <Text className="text-muted text-xs leading-5 mt-1">
                              {address.full_address}, {address.service_area}
                            </Text>
                          </Pressable>
                        );
                      })}

                      <Pressable
                        onPress={() => setSelectedAddressChoice(NEW_ADDRESS)}
                        className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                          selectedAddressChoice === NEW_ADDRESS
                            ? "border-primary bg-[#FFF8F5]"
                            : "border-[#E4EAF0] bg-[#FAFBFC]"
                        }`}
                      >
                        <View className="w-8 h-8 rounded-xl bg-[#FFF3EE] items-center justify-center">
                          <Plus size={16} color="#FF5A3C" />
                        </View>

                        <Text className="text-primary text-sm font-bold ml-2.5">
                          Use a different address
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {selectedAddressChoice === NEW_ADDRESS && (
                    <View className="mb-5">
                      <Text className="text-secondary text-xs font-semibold mb-1.5">
                        Label (optional)
                      </Text>

                      <TextInput
                        value={newLabel}
                        onChangeText={setNewLabel}
                        placeholder="Home"
                        placeholderTextColor="#94A3B8"
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary"
                      />

                      <Text className="text-secondary text-xs font-semibold mb-1.5">
                        Full address
                      </Text>

                      <TextInput
                        value={newFullAddress}
                        onChangeText={setNewFullAddress}
                        placeholder="House no, street, landmark"
                        placeholderTextColor="#94A3B8"
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary"
                      />

                      <Text className="text-secondary text-xs font-semibold mb-1.5">
                        Area / locality
                      </Text>

                      <TextInput
                        value={newServiceArea}
                        onChangeText={setNewServiceArea}
                        placeholder="e.g. Bharatpur, Chitwan"
                        placeholderTextColor="#94A3B8"
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary"
                      />

                      <Text className="text-secondary text-xs font-semibold mb-1.5">
                        Landmark (optional)
                      </Text>

                      <TextInput
                        value={newLandmark}
                        onChangeText={setNewLandmark}
                        placeholder="Nearby landmark"
                        placeholderTextColor="#94A3B8"
                        className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 mb-3 text-secondary"
                      />

                      <Pressable
                        onPress={() =>
                          setSaveNewAddress((previous) => !previous)
                        }
                        className="flex-row items-center"
                      >
                        <View
                          className={`w-6 h-6 rounded-lg items-center justify-center border ${
                            saveNewAddress
                              ? "bg-primary border-primary"
                              : "bg-white border-[#CBD5E1]"
                          }`}
                        >
                          {saveNewAddress && (
                            <Check size={14} color="#FFFFFF" />
                          )}
                        </View>

                        <Text className="text-secondary text-xs ml-2.5 flex-1">
                          Save this address for future bookings
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* DATE */}
                  <View className="flex-row items-center mb-3 mt-1">
                    <View className="w-9 h-9 rounded-xl bg-[#EEF4FF] items-center justify-center">
                      <Calendar size={17} color="#3563E9" />
                    </View>

                    <View className="ml-2.5">
                      <Text className="text-secondary text-sm font-extrabold">
                        Preferred date
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        Choose a convenient day
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-5"
                    contentContainerStyle={{
                      gap: 8,
                    }}
                  >
                    {DATE_OPTIONS.map((option) => {
                      const isSelected = preferredDate === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setPreferredDate(option.value)}
                          className={`px-4 py-3 rounded-2xl border ${
                            isSelected
                              ? "bg-[#132F57] border-[#132F57]"
                              : "bg-[#FAFBFC] border-[#E2E8F0]"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? "text-white" : "text-secondary"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* TIME */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-xl bg-[#F2F4F7] items-center justify-center">
                      <Clock size={17} color="#64748B" />
                    </View>

                    <View className="ml-2.5">
                      <Text className="text-secondary text-sm font-extrabold">
                        Preferred time
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        Optional
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap mb-5">
                    {TIME_OPTIONS.map((option) => {
                      const isSelected = preferredTime === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() =>
                            setPreferredTime(isSelected ? null : option.value)
                          }
                          className={`px-3.5 py-2.5 rounded-xl mr-2 mb-2 border ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "bg-[#FAFBFC] border-[#E2E8F0]"
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              isSelected ? "text-white" : "text-secondary"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* PAYMENT */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-xl bg-[#EAF8F1] items-center justify-center">
                      <Wallet size={17} color="#159A64" />
                    </View>

                    <View className="ml-2.5">
                      <Text className="text-secondary text-sm font-extrabold">
                        Payment method
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        Select how you want to pay
                      </Text>
                    </View>
                  </View>

                  <View className="mb-5">
                    {PAYMENT_METHOD_OPTIONS.map((option) => {
                      const isSelected = paymentMethod === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setPaymentMethod(option.value)}
                          className={`flex-row items-center justify-between border rounded-2xl px-4 py-3.5 mb-2 ${
                            isSelected
                              ? "border-primary bg-[#FFF8F5]"
                              : "border-[#E4EAF0] bg-[#FAFBFC]"
                          }`}
                        >
                          <View className="flex-row items-center flex-1 pr-3">
                            <View className="w-9 h-9 rounded-xl bg-white border border-[#E8EDF3] items-center justify-center">
                              {option.value === "cash" ? (
                                <Banknote size={17} color="#132F57" />
                              ) : (
                                <Wallet size={17} color="#132F57" />
                              )}
                            </View>

                            <View className="ml-3 flex-1">
                              <Text className="text-secondary text-sm font-bold">
                                {option.label}
                              </Text>

                              <Text className="text-muted text-[10px] mt-0.5">
                                {option.helper}
                              </Text>
                            </View>
                          </View>

                          {isSelected && (
                            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                              <Check size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {/* PROMO CODE */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-xl bg-[#FFF3EE] items-center justify-center">
                      <Tag size={17} color="#FF5A3C" />
                    </View>

                    <View className="ml-2.5">
                      <Text className="text-secondary text-sm font-extrabold">
                        Promo code
                      </Text>

                      <Text className="text-muted text-[10px] mt-0.5">
                        Optional discount code
                      </Text>
                    </View>
                  </View>

                  <View className="mb-5">
                    <TextInput
                      value={promoCode}
                      onChangeText={(value) =>
                        setPromoCode(
                          value.toUpperCase().replace(/\s+/g, "").slice(0, 50),
                        )
                      }
                      placeholder="Enter promo code"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-secondary"
                    />

                    {promoCode.trim() ? (
                      <View className="flex-row items-center mt-2">
                        <CheckCircle2 size={14} color="#159A64" />

                        <Text className="text-[#159A64] text-[10px] font-semibold ml-1.5">
                          {promoCode.trim().toUpperCase()} will be applied
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* NOTES */}
                  <Text className="text-secondary text-sm font-extrabold mb-1.5">
                    Notes{" "}
                    <Text className="text-muted font-medium">(optional)</Text>
                  </Text>

                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Anything the provider should know"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 min-h-[100px] text-secondary"
                  />

                  {bookingError && (
                    <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl px-4 py-3 mt-3">
                      <Text className="text-[#BE123C] text-xs font-semibold">
                        {bookingError}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={submitBooking}
                    disabled={submitting}
                    className={`rounded-2xl py-4 items-center mt-5 ${
                      submitting
                        ? "bg-primary/70"
                        : "bg-primary active:opacity-80"
                    }`}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold text-base">
                          Confirm booking
                        </Text>

                        <ArrowRight
                          size={17}
                          color="#FFFFFF"
                          style={{
                            marginLeft: 7,
                          }}
                        />
                      </View>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
