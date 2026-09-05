import React, { createContext, useContext, useEffect, useState } from "react";

import providerApi from "@/api/provider-client";
import { getMyProviderProfile } from "@/api/provider-profile";

import {
  clearProviderToken,
  getProviderToken,
  setProviderToken,
} from "@/api/provider-storage";

import type { AuthenticatedProvider, ProviderLoginResponse } from "@/types";

interface ProviderLoginInput {
  email?: string;
  phone?: string;
  password: string;
}

interface ProviderAuthContextValue {
  provider: AuthenticatedProvider | null;
  isProviderLoading: boolean;
  isProviderAuthenticated: boolean;

  loginProvider: (input: ProviderLoginInput) => Promise<AuthenticatedProvider>;

  refreshProvider: () => Promise<AuthenticatedProvider | null>;
  logoutProvider: () => Promise<void>;
}

const ProviderAuthContext = createContext<ProviderAuthContextValue | undefined>(
  undefined,
);

export function ProviderAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [provider, setProvider] = useState<AuthenticatedProvider | null>(null);

  const [isProviderLoading, setIsProviderLoading] = useState(true);

  useEffect(() => {
    void restoreProviderSession();
  }, []);

  async function restoreProviderSession(): Promise<void> {
    try {
      setIsProviderLoading(true);

      const token = await getProviderToken();

      if (!token) {
        setProvider(null);
        return;
      }

      const profile = await getMyProviderProfile();

      setProvider(profile);
    } catch (error) {
      console.error("Restore provider session error:", error);

      await clearProviderToken();
      setProvider(null);
    } finally {
      setIsProviderLoading(false);
    }
  }

  async function loginProvider({
    email,
    phone,
    password,
  }: ProviderLoginInput): Promise<AuthenticatedProvider> {
    const payload: Record<string, string> = { password };

    if (email) {
      payload.email = email.trim().toLowerCase();
    }

    if (phone) {
      payload.phone = phone.trim();
    }

    const { data } = await providerApi.post<ProviderLoginResponse>(
      "/auth/provider/login",
      payload,
    );

    await setProviderToken(data.token);

    try {
      const profile = await getMyProviderProfile();

      setProvider(profile);

      return profile;
    } catch (error) {
      await clearProviderToken();
      setProvider(null);

      throw error;
    }
  }

  async function refreshProvider(): Promise<AuthenticatedProvider | null> {
    try {
      const token = await getProviderToken();

      if (!token) {
        setProvider(null);
        return null;
      }

      const profile = await getMyProviderProfile();

      setProvider(profile);

      return profile;
    } catch (error) {
      console.error("Refresh provider profile error:", error);

      await clearProviderToken();
      setProvider(null);

      return null;
    }
  }

  async function logoutProvider(): Promise<void> {
    await clearProviderToken();
    setProvider(null);
  }

  return (
    <ProviderAuthContext.Provider
      value={{
        provider,
        isProviderLoading,
        isProviderAuthenticated: Boolean(provider),
        loginProvider,
        refreshProvider,
        logoutProvider,
      }}
    >
      {children}
    </ProviderAuthContext.Provider>
  );
}

export function useProviderAuth() {
  const context = useContext(ProviderAuthContext);

  if (!context) {
    throw new Error("useProviderAuth must be used within ProviderAuthProvider");
  }

  return context;
}
