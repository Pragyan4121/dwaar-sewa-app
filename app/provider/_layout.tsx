import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-reset-otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen
        name="earnings"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="earnings-statement"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="transactions"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="withdrawals"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
