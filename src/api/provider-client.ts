import axios from "axios";

import { clearProviderToken, getProviderToken } from "./provider-storage";

const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const providerApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

providerApi.interceptors.request.use(async (config) => {
  const providerToken = await getProviderToken();

  if (providerToken) {
    config.headers.Authorization = `Bearer ${providerToken}`;
  }

  return config;
});

providerApi.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error?.response?.status === 401) {
      await clearProviderToken();
    }

    return Promise.reject(error);
  },
);

export default providerApi;
