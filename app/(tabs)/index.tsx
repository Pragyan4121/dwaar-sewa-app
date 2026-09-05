import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";

import api from "@/api/client";
import { getMyNotifications } from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { CategorySkeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import type { ServiceCategory } from "@/types";
import { HomeServiceSearch } from "@/components/HomeServiceSearch";
import { HomePromotionBanner } from "@/components/HomePromotionBanner";

type CategoryWithImage = ServiceCategory & {
  image_url?: string | null;
  description?: string | null;
};

function getCategoryImageUrl(imageUrl?: string | null) {
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

function getCategoryEmoji(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("electric") || normalized.includes("wiring")) {
    return "⚡";
  }

  if (normalized.includes("plumb") || normalized.includes("water")) {
    return "🔧";
  }

  if (normalized.includes("clean") || normalized.includes("maid")) {
    return "✨";
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

  if (normalized.includes("pest") || normalized.includes("control")) {
    return "🛡️";
  }

  if (normalized.includes("garden") || normalized.includes("plant")) {
    return "🌿";
  }

  return "🧰";
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const contentMaxWidth = 1180;

  const firstName = user?.full_name
    ? user.full_name.trim().split(" ")[0]
    : null;

  const loadCategories = useCallback(() => {
    setError(null);

    api
      .get<{ categories: ServiceCategory[] }>("/categories")
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setError("Couldn't load categories."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  const loadUnreadNotificationCount = useCallback(async () => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const result = await getMyNotifications({
        page: 1,
        limit: 1,
        unreadOnly: false,
      });

      setUnreadNotificationCount(result.unread_count);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      void loadUnreadNotificationCount();
    }, [loadCategories, loadUnreadNotificationCount]),
  );

  const categoryCardWidth = isDesktop ? "23.5%" : isTablet ? "31.5%" : "48.5%";

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCategories();
            }}
            tintColor="#FF5A3C"
          />
        }
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          }}
        >
          {/* HEADER */}
          <View className="px-5 pt-3 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                    <MapPin size={19} color="#FF5A3C" strokeWidth={2.3} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-muted text-xs font-medium">
                      HOME SERVICES
                    </Text>

                    <Text
                      className="text-secondary text-xl font-bold mt-0.5"
                      numberOfLines={1}
                    >
                      {firstName
                        ? `Hi, ${firstName} 👋`
                        : "Welcome to Dwaar Sewa"}
                    </Text>
                  </View>
                </View>
              </View>

              {user ? (
                <Pressable
                  onPress={() => router.push("/notifications")}
                  className="relative h-11 w-11 items-center justify-center rounded-2xl border border-[#E7ECF2] bg-white active:opacity-70"
                >
                  <Bell size={19} color="#132F57" strokeWidth={2.2} />

                  {unreadNotificationCount > 0 ? (
                    <View className="absolute -right-1 -top-1 min-w-[20px] h-5 px-1 items-center justify-center rounded-full bg-[#FF5A3C] border-2 border-[#F8FAFC]">
                      <Text className="text-[9px] font-extrabold text-white">
                        {unreadNotificationCount > 99
                          ? "99+"
                          : unreadNotificationCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-2">
                  {!isTablet && (
                    <Pressable
                      onPress={() => router.push("/auth/choose-role")}
                      className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-white active:opacity-70"
                    >
                      <Text className="text-secondary text-xs font-semibold">
                        Sign up
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => router.push("/auth/login")}
                    className="bg-primary px-4 py-2.5 rounded-xl active:opacity-80"
                  >
                    <Text className="text-white text-xs font-bold">
                      Sign in
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* HERO */}
          <View className="px-5">
            <View
              className={`bg-[#132F57] overflow-hidden ${
                isTablet ? "rounded-[28px] p-8" : "rounded-[24px] p-5"
              }`}
            >
              <View className={isTablet ? "flex-row items-center" : ""}>
                <View className={isTablet ? "flex-1 pr-8" : ""}>
                  <View className="self-start flex-row items-center bg-white/10 px-3 py-1.5 rounded-full mb-3">
                    <Sparkles size={14} color="#F9C74F" />

                    <Text className="text-white/90 text-[11px] font-bold ml-1.5 tracking-wide">
                      RELIABLE SERVICES AT YOUR DOOR
                    </Text>
                  </View>

                  <Text
                    className={`text-white font-extrabold ${
                      isTablet
                        ? "text-4xl leading-[45px]"
                        : "text-[28px] leading-[34px]"
                    }`}
                  >
                    Your home needs it.
                    {"\n"}
                    We’ll get it done.
                  </Text>

                  <Text className="text-white/70 text-sm leading-5 mt-3 max-w-[520px]">
                    Book trusted local professionals for repairs, cleaning,
                    maintenance and more.
                  </Text>
                </View>

                <View
                  className={isTablet ? "w-[360px]" : "mt-6"}
                  style={{
                    zIndex: 50,
                  }}
                >
                  <HomeServiceSearch categories={categories} />
                </View>
              </View>
            </View>
          </View>

          {/* TRUST STRIP */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 4,
              gap: 10,
            }}
          >
            <View className="bg-white border border-[#E8EDF3] rounded-2xl px-4 py-3 flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#EAF8F1] items-center justify-center">
                <BadgeCheck size={18} color="#159A64" />
              </View>

              <View className="ml-2.5">
                <Text className="text-secondary text-xs font-bold">
                  Verified Pros
                </Text>
                <Text className="text-muted text-[10px] mt-0.5">
                  Trusted providers
                </Text>
              </View>
            </View>

            <View className="bg-white border border-[#E8EDF3] rounded-2xl px-4 py-3 flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#EEF4FF] items-center justify-center">
                <ShieldCheck size={18} color="#3563E9" />
              </View>

              <View className="ml-2.5">
                <Text className="text-secondary text-xs font-bold">
                  Safe Booking
                </Text>
                <Text className="text-muted text-[10px] mt-0.5">
                  Reliable service
                </Text>
              </View>
            </View>

            <View className="bg-white border border-[#E8EDF3] rounded-2xl px-4 py-3 flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#FFF3EA] items-center justify-center">
                <Clock3 size={18} color="#EA7A28" />
              </View>

              <View className="ml-2.5">
                <Text className="text-secondary text-xs font-bold">
                  Quick Support
                </Text>
                <Text className="text-muted text-[10px] mt-0.5">
                  When you need us
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* OFFER */}
          <HomePromotionBanner icon={<Sparkles size={20} color="#FFFFFF" />} />

          {/* CATEGORIES */}
          <View className="px-5 mt-7 pb-8">
            <View className="flex-row items-end justify-between mb-4">
              <View>
                <Text className="text-secondary text-xl font-extrabold">
                  Browse services
                </Text>

                <Text className="text-muted text-xs mt-1">
                  Find the right professional for your home
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/(tabs)/services")}
                className="flex-row items-center px-2 py-2 active:opacity-60"
              >
                <Text className="text-primary text-xs font-bold mr-1">
                  See all
                </Text>

                <ArrowRight size={14} color="#FF5A3C" />
              </Pressable>
            </View>

            {loading && (
              <View className="flex-row flex-wrap justify-between">
                {Array.from({
                  length: isDesktop ? 8 : 6,
                }).map((_, index) => (
                  <CategorySkeleton key={index} />
                ))}
              </View>
            )}

            {!loading && error && (
              <View className="bg-white rounded-3xl border border-[#E8EDF3] overflow-hidden">
                <ErrorState message={error} onRetry={loadCategories} />
              </View>
            )}

            {!loading && !error && categories.length === 0 && (
              <View className="bg-white rounded-3xl border border-[#E8EDF3] px-5 py-10 items-center">
                <View className="w-14 h-14 rounded-full bg-[#F1F5F9] items-center justify-center">
                  <Text className="text-2xl">🧰</Text>
                </View>

                <Text className="text-secondary text-base font-bold mt-3">
                  Services coming soon
                </Text>

                <Text className="text-muted text-xs text-center mt-1 max-w-[260px]">
                  We’re preparing trusted home services for you.
                </Text>
              </View>
            )}

            {!loading && !error && categories.length > 0 && (
              <View className="flex-row flex-wrap justify-between">
                {categories.map((item) => {
                  const category = item as CategoryWithImage;

                  const imageUrl = getCategoryImageUrl(category.image_url);

                  return (
                    <Pressable
                      key={category.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/services",
                          params: {
                            categoryId: category.id,
                          },
                        })
                      }
                      style={{
                        width: categoryCardWidth,
                      }}
                      className="bg-white border border-[#E7ECF2] rounded-[22px] mb-3 overflow-hidden active:opacity-75"
                    >
                      <View className="h-[105px] bg-[#F1F5F9] overflow-hidden">
                        {imageUrl ? (
                          <Image
                            source={{
                              uri: imageUrl,
                            }}
                            resizeMode="cover"
                            className="w-full h-full"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center bg-[#F6F8FB]">
                            <View className="w-14 h-14 rounded-2xl bg-white border border-[#E8EDF3] items-center justify-center">
                              <Text className="text-[25px]">
                                {getCategoryEmoji(category.name)}
                              </Text>
                            </View>
                          </View>
                        )}

                        <View className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/95 items-center justify-center">
                          <ArrowRight size={13} color="#132F57" />
                        </View>
                      </View>

                      <View className="px-3.5 py-3">
                        <Text
                          className="text-secondary text-sm font-bold"
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>

                        <Text
                          className="text-muted text-[10px] mt-1"
                          numberOfLines={1}
                        >
                          Book trusted professionals
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
