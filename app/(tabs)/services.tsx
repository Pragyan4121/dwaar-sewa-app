import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  Clock3,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";

import api from "@/api/client";
import { ServiceCardSkeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import type { Service, ServiceCategory } from "@/types";

type ServiceWithImage = Service & {
  image_url?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
};

function getImageUrl(imageUrl?: string | null) {
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

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();

  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [services, setServices] = useState<Service[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(params.categoryId ? Number(params.categoryId) : undefined);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  useEffect(() => {
    api
      .get<{ categories: ServiceCategory[] }>("/categories")
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const loadServices = useCallback((categoryId?: number) => {
    setError(null);

    api
      .get<{ services: Service[] }>("/services", {
        params: categoryId ? { categoryId } : {},
      })
      .then(({ data }) => setServices(data.services))
      .catch(() => setError("Couldn't load services."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    loadServices(selectedCategoryId);
  }, [selectedCategoryId, loadServices]);

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  const listKey = `services-${numColumns}`;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
      <FlatList
        key={listKey}
        data={!loading && !error ? filteredServices : []}
        keyExtractor={(item) => String(item.id)}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={
          numColumns > 1
            ? {
                gap: 14,
              }
            : undefined
        }
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadServices(selectedCategoryId);
            }}
            tintColor="#FF5A3C"
          />
        }
        ListHeaderComponent={
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
            }}
          >
            {/* PAGE HEADER */}
            <View className="px-5 pt-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-secondary text-[26px] font-extrabold">
                    Find a service
                  </Text>

                  <Text className="text-muted text-sm mt-1">
                    Trusted professionals for your home
                  </Text>
                </View>

                <View className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center">
                  <SlidersHorizontal size={19} color="#132F57" />
                </View>
              </View>
            </View>

            {/* SEARCH */}
            <View className="px-5 mt-5">
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-[20px] px-4 py-1">
                <View className="w-10 h-10 rounded-xl bg-[#F5F7FA] items-center justify-center">
                  <Search size={19} color="#64748B" />
                </View>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder='Search "AC repair", "cleaning"...'
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-3 text-secondary text-sm py-3"
                />

                {search.length > 0 && (
                  <Pressable
                    onPress={() => setSearch("")}
                    className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center active:opacity-70"
                  >
                    <X size={16} color="#64748B" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* CATEGORY CHIPS */}
            <View className="mt-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={() => setSelectedCategoryId(undefined)}
                  className={`px-4 py-2.5 rounded-full border ${
                    selectedCategoryId === undefined
                      ? "bg-[#132F57] border-[#132F57]"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedCategoryId === undefined
                        ? "text-white"
                        : "text-secondary"
                    }`}
                  >
                    All services
                  </Text>
                </Pressable>

                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category.id;

                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      className={`px-4 py-2.5 rounded-full border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-white border-[#E2E8F0]"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-white" : "text-secondary"
                        }`}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* CONTEXT CARD */}
            <View className="px-5 mt-5">
              <View className="bg-[#132F57] rounded-[22px] p-5 overflow-hidden">
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center">
                    <Sparkles size={20} color="#FFD166" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-white text-sm font-bold">
                      {selectedCategory
                        ? selectedCategory.name
                        : "All home services"}
                    </Text>

                    <Text className="text-white/70 text-xs mt-1">
                      Browse trusted local professionals near you
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION TITLE */}
            <View className="px-5 mt-7 mb-4 flex-row items-end justify-between">
              <View>
                <Text className="text-secondary text-xl font-extrabold">
                  Available services
                </Text>

                {!loading && !error && (
                  <Text className="text-muted text-xs mt-1">
                    {filteredServices.length}{" "}
                    {filteredServices.length === 1 ? "service" : "services"}{" "}
                    found
                  </Text>
                )}
              </View>
            </View>

            {/* LOADING */}
            {loading && (
              <View className="px-5">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </View>
            )}

            {/* ERROR */}
            {!loading && error && (
              <View className="px-5">
                <View className="bg-white rounded-3xl border border-[#E8EDF3] overflow-hidden">
                  <ErrorState
                    message={error}
                    onRetry={() => {
                      setLoading(true);
                      loadServices(selectedCategoryId);
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View
              style={{
                width: "100%",
                maxWidth: 1180,
                alignSelf: "center",
              }}
              className="px-5"
            >
              <View className="bg-white border border-[#E7ECF2] rounded-[24px] py-12 px-6 items-center">
                <View className="w-16 h-16 rounded-2xl bg-[#F5F7FA] items-center justify-center">
                  <Search size={26} color="#94A3B8" />
                </View>

                <Text className="text-secondary text-base font-bold mt-4">
                  No services found
                </Text>

                <Text className="text-muted text-xs text-center mt-1 max-w-[280px]">
                  Try another search or choose a different category.
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const service = item as ServiceWithImage;

          const imageUrl = getImageUrl(service.image_url);

          return (
            <View
              style={{
                flex: numColumns > 1 ? 1 : undefined,
                paddingHorizontal: numColumns === 1 ? 20 : 0,
                marginLeft: numColumns > 1 ? 20 : 0,
                marginRight: numColumns > 1 ? 20 : 0,
              }}
            >
              <Pressable
                onPress={() => router.push(`/service/${service.id}`)}
                className="bg-white border border-[#E7ECF2] rounded-[24px] mb-4 overflow-hidden active:opacity-80"
              >
                {/* IMAGE */}
                <View className="h-[150px] bg-[#F1F5F9]">
                  {imageUrl ? (
                    <Image
                      source={{
                        uri: imageUrl,
                      }}
                      resizeMode="cover"
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <View className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] items-center justify-center">
                        <Text className="text-[28px]">
                          {getServiceEmoji(service.name)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="absolute top-3 left-3 bg-white/95 rounded-full px-3 py-1.5">
                    <Text className="text-secondary text-[10px] font-bold">
                      HOME SERVICE
                    </Text>
                  </View>
                </View>

                {/* DETAILS */}
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-secondary text-base font-extrabold"
                        numberOfLines={2}
                      >
                        {service.name}
                      </Text>

                      {service.description && (
                        <Text
                          className="text-muted text-xs leading-5 mt-1.5"
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      )}
                    </View>

                    <View className="items-end">
                      <Text className="text-muted text-[10px]">From</Text>

                      <Text className="text-primary text-lg font-extrabold mt-0.5">
                        ₹{service.base_price}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-[#EEF2F6]">
                    <View className="flex-row items-center">
                      {service.duration_minutes ? (
                        <>
                          <Clock3 size={14} color="#64748B" />

                          <Text className="text-muted text-[11px] ml-1.5">
                            {service.duration_minutes} mins
                          </Text>
                        </>
                      ) : (
                        <Text className="text-muted text-[11px]">
                          Flexible timing
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-primary text-xs font-bold mr-1">
                        View details
                      </Text>

                      <ArrowRight size={14} color="#FF5A3C" />
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
