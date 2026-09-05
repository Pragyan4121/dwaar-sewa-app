import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: "#E5E7EB", opacity },
        style,
      ]}
    />
  );
}

export function CategorySkeleton() {
  return (
    <View className="w-[31%] bg-surface border border-border rounded-2xl items-center justify-center py-4 mb-3">
      <Skeleton
        width={44}
        height={44}
        borderRadius={22}
        style={{ marginBottom: 8 }}
      />
      <Skeleton width={50} height={10} />
    </View>
  );
}

export function ServiceCardSkeleton() {
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width={60} height={10} />
      </View>
      <Skeleton width={50} height={18} />
    </View>
  );
}
