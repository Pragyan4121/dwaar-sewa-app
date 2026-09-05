import providerApi from "./provider-client";

import type {
  ProviderOtpResponse,
  ProviderRegistrationOptionsResponse,
  ProviderRegistrationResponse,
  RegisterProviderInput,
} from "@/types";

export async function getProviderRegistrationOptions() {
  const { data } = await providerApi.get<ProviderRegistrationOptionsResponse>(
    "/provider-registration/options",
  );

  return data;
}

export async function registerProvider(input: RegisterProviderInput) {
  const { data } = await providerApi.post<ProviderRegistrationResponse>(
    "/auth/provider/register",
    input,
  );

  return data;
}

export async function verifyProviderEmail(input: {
  email: string;
  code: string;
}) {
  const { data } = await providerApi.post<ProviderOtpResponse>(
    "/auth/provider/verify-email",
    input,
  );

  return data;
}

export async function resendProviderVerificationOtp(email: string) {
  const { data } = await providerApi.post<ProviderOtpResponse>(
    "/auth/provider/resend-verification-otp",
    {
      email,
    },
  );

  return data;
}
export async function requestProviderPasswordReset(email: string) {
  const { data } = await providerApi.post<ProviderOtpResponse>(
    "/auth/provider/forgot-password",
    {
      email: email.trim().toLowerCase(),
    },
  );

  return data;
}

export async function verifyProviderPasswordResetOtp(input: {
  email: string;
  code: string;
}) {
  const { data } = await providerApi.post<ProviderOtpResponse>(
    "/auth/provider/verify-password-reset-otp",
    {
      email: input.email.trim().toLowerCase(),
      code: input.code.trim(),
    },
  );

  return data;
}

export async function resetProviderPassword(input: {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await providerApi.post<{
    message: string;
    password_reset: boolean;
  }>("/auth/provider/reset-password", input);

  return data;
}
