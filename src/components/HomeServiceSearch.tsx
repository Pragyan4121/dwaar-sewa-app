import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Search, X } from "lucide-react-native";

import type { ServiceCategory } from "@/types";

type Props = {
  categories: ServiceCategory[];
};

export function HomeServiceSearch({ categories }: Props) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const matchingCategories =
    normalizedQuery.length > 0
      ? categories
          .filter((category) =>
            category.name.toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 5)
      : [];

  function openCategory(categoryId: number) {
    setQuery("");
    setFocused(false);

    router.push({
      pathname: "/(tabs)/services",
      params: {
        categoryId,
      },
    });
  }

  function handleSearch() {
    if (matchingCategories.length > 0) {
      openCategory(matchingCategories[0].id);

      return;
    }

    if (normalizedQuery) {
      router.push({
        pathname: "/(tabs)/services",
        params: {
          search: query.trim(),
        },
      });

      return;
    }

    setFocused(true);
  }

  return (
    <View
      style={{
        position: "relative",
        zIndex: 50,
      }}
    >
      <View className="flex-row items-center rounded-2xl bg-white px-3 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9]">
          <Search size={19} color="#64748B" />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder="What service do you need?"
          placeholderTextColor="#64748B"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          className="ml-3 flex-1 border-0 bg-transparent text-sm font-semibold text-[#132F57] outline-none"
        />

        {query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setFocused(true);
            }}
            className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] active:opacity-70"
          >
            <X size={15} color="#64748B" />
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleSearch}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#FF5A3C] active:opacity-80"
        >
          <ArrowRight size={17} color="#FFFFFF" />
        </Pressable>
      </View>

      {focused && normalizedQuery.length > 0 ? (
        <View
          className="mt-2 overflow-hidden rounded-2xl border border-[#E7ECF2] bg-white"
          style={{
            shadowColor: "#000000",
            shadowOpacity: 0.08,
            shadowRadius: 15,
            shadowOffset: {
              width: 0,
              height: 5,
            },
            elevation: 6,
          }}
        >
          {matchingCategories.length > 0 ? (
            matchingCategories.map((category, index) => (
              <Pressable
                key={category.id}
                onPress={() => openCategory(category.id)}
                className={`flex-row items-center px-4 py-3.5 active:bg-[#F8FAFC] ${
                  index < matchingCategories.length - 1
                    ? "border-b border-[#EEF2F6]"
                    : ""
                }`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3EE]">
                  <Search size={15} color="#FF5A3C" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-[#132F57]">
                    {category.name}
                  </Text>

                  <Text className="mt-0.5 text-[10px] text-[#94A3B8]">
                    View available services
                  </Text>
                </View>

                <ArrowRight size={15} color="#94A3B8" />
              </Pressable>
            ))
          ) : (
            <Pressable
              onPress={handleSearch}
              className="flex-row items-center px-4 py-4 active:bg-[#F8FAFC]"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9]">
                <Search size={15} color="#64748B" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xs font-bold text-[#132F57]">
                  Search for &quot;
                  {query.trim()}&quot;
                </Text>

                <Text className="mt-1 text-[10px] text-[#94A3B8]">
                  Search all available services
                </Text>
              </View>

              <ArrowRight size={15} color="#FF5A3C" />
            </Pressable>
          )}
        </View>
      ) : null}

      {!focused || !normalizedQuery ? (
        <Text className="ml-1 mt-2 text-[10px] text-white/55">
          Try AC repair, cleaning, plumbing...
        </Text>
      ) : null}
    </View>
  );
}
