import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "dwaarSewaToken";

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
