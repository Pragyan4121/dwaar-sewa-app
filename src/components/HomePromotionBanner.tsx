import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import api from "@/api/client";

type HomePromotion = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  discount_percent: number;
  max_discount_amount: number | null;
  minimum_order_amount: number | null;
  first_booking_only: boolean;
  usage_limit_per_customer: number | null;
  starts_at: string | null;
  ends_at: string | null;
  show_on_home: boolean;
  home_badge_text: string | null;
};

type HomePromotionResponse = {
  promotion: HomePromotion | null;
};

type HomePromotionBannerProps = {
  icon: React.ReactNode;
};

export function HomePromotionBanner({ icon }: HomePromotionBannerProps) {
  const [promotion, setPromotion] = useState<HomePromotion | null>(null);

  const loadPromotion = useCallback(() => {
    console.log("PROMO API BASE:", api.defaults.baseURL);

    api
      .get<HomePromotionResponse>("/promotions/public/home")
      .then(({ data }) => {
        console.log("PROMO RESPONSE:", data);
        setPromotion(data.promotion);
      })
      .catch((error) => {
        console.log("PROMO ERROR:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          baseURL: api.defaults.baseURL,
        });

        setPromotion(null);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPromotion();
    }, [loadPromotion]),
  );

  if (!promotion) {
    return null;
  }

  const discountPercent = Number(promotion.discount_percent);

  const maxDiscount =
    promotion.max_discount_amount === null
      ? null
      : Number(promotion.max_discount_amount);

  const minimumOrder =
    promotion.minimum_order_amount === null
      ? null
      : Number(promotion.minimum_order_amount);

  return (
    <View className="px-5 mt-4">
      <View className="bg-[#FFF3EE] border border-[#FFE0D6] rounded-[22px] px-5 py-4 flex-row items-center">
        <View className="w-11 h-11 rounded-2xl bg-primary items-center justify-center">
          {icon}
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-primary text-[11px] font-extrabold tracking-wide">
            {promotion.home_badge_text?.trim() || "SPECIAL OFFER"}
          </Text>

          <Text className="text-secondary text-base font-bold mt-0.5">
            {promotion.title}
          </Text>

          <Text className="text-muted text-xs mt-0.5">
            Use code {promotion.code}
          </Text>

          <Text className="text-muted text-[11px] mt-1">
            {discountPercent}% off
            {maxDiscount !== null ? ` up to Rs. ${maxDiscount}` : ""}
            {minimumOrder !== null ? ` • Min. booking Rs. ${minimumOrder}` : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
