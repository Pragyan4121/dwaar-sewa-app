import providerApi from "./provider-client";

import type { AuthenticatedProvider, ProviderProfileResponse } from "@/types";

export interface UpdateProviderProfileInput {
  fullName?: string;
  phone?: string;
  address?: string | null;
  bio?: string | null;
  yearsOfExperience?: number;
  profilePhotoUrl?: string | null;
}

export async function getMyProviderProfile(): Promise<AuthenticatedProvider> {
  const { data } = await providerApi.get<ProviderProfileResponse>(
    "/providers/me/profile",
  );

  return data.provider;
}

export async function updateMyProviderProfile(
  input: UpdateProviderProfileInput,
): Promise<void> {
  await providerApi.patch("/providers/me/profile", input);
}

export interface UploadedProviderFile {
  file_url: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

/**
 * Uploads a profile photo file to the backend, which stores it on disk and
 * immediately saves the resulting URL onto the provider's profile.
 *
 * `asset` is whatever expo-image-picker returns for a selected image
 * (uri, plus optional mimeType/fileName).
 */
export async function uploadProviderProfilePhoto(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<UploadedProviderFile> {
  const formData = new FormData();

  const inferredName =
    asset.fileName ?? asset.uri.split("/").pop() ?? `profile-photo.jpg`;
  const inferredType = asset.mimeType ?? "image/jpeg";

  formData.append("file", {
    uri: asset.uri,
    name: inferredName,
    type: inferredType,
  } as unknown as Blob);

  const { data } = await providerApi.post<{
    message: string;
    file: UploadedProviderFile;
  }>("/provider-registration/upload/profile-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.file;
}
