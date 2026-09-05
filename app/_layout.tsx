import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";

import MaintenanceScreen, {
  type MaintenanceSettings,
} from "@/components/MaintenanceScreen";

import { AuthProvider } from "@/context/AuthContext";
import { ProviderAuthProvider } from "@/context/ProviderAuthContext";
import { CallProvider } from "@/providers/call-provider";

type PublicSettingsResponse = {
  message?: string;

  settings?: Record<string, unknown>;
};

type MaintenanceState = {
  isLoading: boolean;
  enabled: boolean;
  settings: MaintenanceSettings;
};

function getPublicSettingsUrl() {
  const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return null;
  }

  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  if (/\/api$/i.test(baseUrl)) {
    return `${baseUrl}/settings/public`;
  }

  return `${baseUrl}/api/settings/public`;
}

function parseBooleanSetting(value: unknown) {
  if (value === true) {
    return true;
  }

  if (typeof value === "string" && value.trim().toLowerCase() === "true") {
    return true;
  }

  return false;
}

function getStringSetting(settings: Record<string, unknown>, key: string) {
  const value = settings[key];

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

export default function RootLayout() {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    isLoading: true,
    enabled: false,
    settings: {},
  });

  const isMountedRef = useRef(true);

  const checkMaintenanceMode = useCallback(async () => {
    const publicSettingsUrl = getPublicSettingsUrl();

    if (!publicSettingsUrl) {
      console.warn("EXPO_PUBLIC_API_BASE_URL is not configured.");

      if (isMountedRef.current) {
        setMaintenanceState((current) => ({
          ...current,
          isLoading: false,
          enabled: false,
        }));
      }

      return;
    }

    try {
      const response = await fetch(publicSettingsUrl, {
        method: "GET",

        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Public settings request failed with ${response.status}`,
        );
      }

      const data = (await response.json()) as PublicSettingsResponse;

      const rawSettings =
        data.settings && typeof data.settings === "object" ? data.settings : {};

      const enabled = parseBooleanSetting(rawSettings.maintenance_mode);

      const maintenanceSettings: MaintenanceSettings = {
        business_name: getStringSetting(rawSettings, "business_name"),

        support_email: getStringSetting(rawSettings, "support_email"),

        support_phone: getStringSetting(rawSettings, "support_phone"),

        maintenance_badge: getStringSetting(rawSettings, "maintenance_badge"),

        maintenance_title: getStringSetting(rawSettings, "maintenance_title"),

        maintenance_message: getStringSetting(
          rawSettings,
          "maintenance_message",
        ),

        maintenance_return_title: getStringSetting(
          rawSettings,
          "maintenance_return_title",
        ),

        maintenance_return_message: getStringSetting(
          rawSettings,
          "maintenance_return_message",
        ),

        maintenance_support_title: getStringSetting(
          rawSettings,
          "maintenance_support_title",
        ),

        maintenance_thank_you_title: getStringSetting(
          rawSettings,
          "maintenance_thank_you_title",
        ),

        maintenance_thank_you_message: getStringSetting(
          rawSettings,
          "maintenance_thank_you_message",
        ),

        maintenance_side_note: getStringSetting(
          rawSettings,
          "maintenance_side_note",
        ),

        maintenance_service_message: getStringSetting(
          rawSettings,
          "maintenance_service_message",
        ),

        maintenance_footer_item_1: getStringSetting(
          rawSettings,
          "maintenance_footer_item_1",
        ),

        maintenance_footer_item_2: getStringSetting(
          rawSettings,
          "maintenance_footer_item_2",
        ),

        maintenance_footer_item_3: getStringSetting(
          rawSettings,
          "maintenance_footer_item_3",
        ),

        maintenance_brand_tagline: getStringSetting(
          rawSettings,
          "maintenance_brand_tagline",
        ),
      };

      if (isMountedRef.current) {
        setMaintenanceState({
          isLoading: false,
          enabled,
          settings: maintenanceSettings,
        });
      }
    } catch (error) {
      console.error("Maintenance mode check failed:", error);

      /*
        |--------------------------------------------------------------------------
        | Fail open
        |--------------------------------------------------------------------------
        |
        | If the settings endpoint temporarily fails, do not accidentally lock
        | every customer/provider out of the app.
        |
        |--------------------------------------------------------------------------
        */

      if (isMountedRef.current) {
        setMaintenanceState((current) => ({
          ...current,
          isLoading: false,
          enabled: false,
        }));
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void checkMaintenanceMode();

    /*
    |--------------------------------------------------------------------------
    | Re-check periodically
    |--------------------------------------------------------------------------
    |
    | If the admin switches maintenance mode ON or OFF while the application
    | is already open, users will receive the new state without restarting.
    |
    |--------------------------------------------------------------------------
    */

    const interval = setInterval(() => {
      void checkMaintenanceMode();
    }, 30_000);

    /*
    |--------------------------------------------------------------------------
    | Re-check whenever app returns to foreground
    |--------------------------------------------------------------------------
    */

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void checkMaintenanceMode();
      }
    });

    return () => {
      isMountedRef.current = false;

      clearInterval(interval);

      subscription.remove();
    };
  }, [checkMaintenanceMode]);

  /*
  |--------------------------------------------------------------------------
  | Initial maintenance check
  |--------------------------------------------------------------------------
  |
  | Normal app UI is deliberately NOT rendered here. This prevents customers
  | from briefly seeing the normal application before maintenance mode loads.
  |
  |--------------------------------------------------------------------------
  */

  if (maintenanceState.isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />

        <View style={styles.loadingScreen}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingLogoText}>DS</Text>
          </View>

          <Text style={styles.loadingTitle}>Dwaar Sewa</Text>

          <ActivityIndicator
            size="small"
            color="#173765"
            style={styles.loadingIndicator}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Maintenance screen
  |--------------------------------------------------------------------------
  */

  if (maintenanceState.enabled) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />

        <MaintenanceScreen settings={maintenanceState.settings} />
      </SafeAreaProvider>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Normal application
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProviderAuthProvider>
          <CallProvider>
            <StatusBar style="dark" />

            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" />

              <Stack.Screen name="provider" />

              <Stack.Screen
                name="auth/login"
                options={{
                  presentation: "modal",
                }}
              />

              <Stack.Screen
                name="auth/register"
                options={{
                  presentation: "modal",
                }}
              />

              <Stack.Screen
                name="auth/choose-role"
                options={{
                  presentation: "modal",
                }}
              />

              <Stack.Screen
                name="service/[id]"
                options={{
                  headerShown: true,
                  title: "",
                }}
              />

              <Stack.Screen
                name="booking/[id]"
                options={{
                  headerShown: true,
                  title: "Booking",
                }}
              />
            </Stack>
          </CallProvider>
        </ProviderAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fbff",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogo: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#173765",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },

  loadingTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "800",
    color: "#173765",
  },

  loadingIndicator: {
    marginTop: 18,
  },
});
