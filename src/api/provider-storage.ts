import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const PROVIDER_TOKEN_KEY = "dwaarSewaProviderToken";

export async function getProviderToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? localStorage.getItem(PROVIDER_TOKEN_KEY)
      : null;
  }

  return SecureStore.getItemAsync(PROVIDER_TOKEN_KEY);
}

export async function setProviderToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      localStorage.setItem(PROVIDER_TOKEN_KEY, token);
    }

    return;
  }

  await SecureStore.setItemAsync(PROVIDER_TOKEN_KEY, token);
}

export async function clearProviderToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      localStorage.removeItem(PROVIDER_TOKEN_KEY);
    }

    return;
  }

  await SecureStore.deleteItemAsync(PROVIDER_TOKEN_KEY);
}
