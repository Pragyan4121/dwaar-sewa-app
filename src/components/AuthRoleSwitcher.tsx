import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

type AuthRole = "customer" | "provider";

interface AuthRoleSwitcherProps {
  active: AuthRole;
}

/**
 * Segmented Customer / Provider switcher shown at the top of both login
 * screens. Tapping the inactive segment replaces the current route with
 * the other login screen, so there's always one clear way to move between
 * the two — no more landing on the wrong login form by accident.
 */
export function AuthRoleSwitcher({ active }: AuthRoleSwitcherProps) {
  const router = useRouter();

  function goTo(role: AuthRole) {
    if (role === active) {
      return;
    }

    router.replace(role === "customer" ? "/auth/login" : "/provider/login");
  }

  return (
    <View className="flex-row bg-surface border border-border rounded-full p-1 mb-6">
      <Pressable
        onPress={() => goTo("customer")}
        className={`flex-1 items-center py-2.5 rounded-full ${
          active === "customer" ? "bg-primary" : ""
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            active === "customer" ? "text-white" : "text-muted"
          }`}
        >
          Customer
        </Text>
      </Pressable>

      <Pressable
        onPress={() => goTo("provider")}
        className={`flex-1 items-center py-2.5 rounded-full ${
          active === "provider" ? "bg-green-700" : ""
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            active === "provider" ? "text-white" : "text-muted"
          }`}
        >
          Provider
        </Text>
      </Pressable>
    </View>
  );
}
