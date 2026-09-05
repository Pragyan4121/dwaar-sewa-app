import api from "@/api/client";

export interface CustomerForgotPasswordResponse {
  message: string;
  otp_expires_at?: string;
  otp_resend_after_seconds?: number;
}

export interface CustomerVerifyPasswordResetOtpResponse {
  message: string;
  reset_verified: boolean;
  reset_token: string;
  customer?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface CustomerResetPasswordResponse {
  message: string;
  password_reset: boolean;
}

export async function requestCustomerPasswordReset(
  email: string,
): Promise<CustomerForgotPasswordResponse> {
  const response = await api.post<CustomerForgotPasswordResponse>(
    "/auth/customer/forgot-password",
    {
      email,
    },
  );

  return response.data;
}

export async function verifyCustomerPasswordResetOtp(input: {
  email: string;
  code: string;
}): Promise<CustomerVerifyPasswordResetOtpResponse> {
  const response = await api.post<CustomerVerifyPasswordResetOtpResponse>(
    "/auth/customer/verify-password-reset-otp",
    input,
  );

  return response.data;
}

export async function resetCustomerPassword(input: {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<CustomerResetPasswordResponse> {
  const response = await api.post<CustomerResetPasswordResponse>(
    "/auth/customer/reset-password",
    input,
  );

  return response.data;
}
