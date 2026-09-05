import providerApi from "./provider-client";

import type {
  ProviderAvailabilityResponse,
  ProviderDashboardResponse,
} from "@/types";

export async function getProviderDashboard() {
  const { data } = await providerApi.get<ProviderDashboardResponse>(
    "/provider/dashboard",
  );

  return data;
}

export async function updateProviderAvailability(isAvailable: boolean) {
  const { data } = await providerApi.patch<ProviderAvailabilityResponse>(
    "/provider/dashboard/availability",
    {
      isAvailable,
    },
  );

  return data;
}
