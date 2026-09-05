import { View, Text, Pressable } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center px-6 py-10">
      <AlertCircle size={28} color="#EF4444" style={{ marginBottom: 10 }} />
      <Text className="text-secondary text-sm font-medium text-center mb-1">
        {message}
      </Text>
      <Text className="text-muted text-xs text-center mb-4">
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        className="flex-row items-center gap-2 bg-primary px-4 py-2.5 rounded-xl"
      >
        <RefreshCw size={14} color="#fff" />
        <Text className="text-white font-semibold text-sm">Try again</Text>
      </Pressable>
    </View>
  );
}
