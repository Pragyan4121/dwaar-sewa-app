import { Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type SignInPromptProps = {
  title: string;
  message?: string;
};

/**
 * Shared "you're not signed in" prompt.
 * Used by every screen (Home, Wallet, Bookings, Profile) so the
 * sign-in / create-account experience is identical everywhere.
 */
export function SignInPrompt({ title, message }: SignInPromptProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-secondary text-lg font-bold mb-2 text-center">
        {title}
      </Text>

      {message ? (
        <Text className="text-muted text-sm mb-6 text-center">{message}</Text>
      ) : null}

      <Pressable
        onPress={() => router.push("/auth/login")}
        className="bg-primary px-5 py-2.5 rounded-xl w-full items-center mb-3"
      >
        <Text className="text-white font-semibold">Sign in</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/auth/choose-role")}
        className="border border-border px-5 py-2.5 rounded-xl w-full items-center"
      >
        <Text className="text-secondary font-semibold">
          Create a new account
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
