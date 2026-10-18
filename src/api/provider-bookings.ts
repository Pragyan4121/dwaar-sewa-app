import providerApi from "./provider-client";

import type {
  ProviderBooking,
  ProviderBookingDetails,
  ProviderBookingDetailsResponse,
  ProviderBookingListResponse,
} from "@/types";

export async function getAvailableProviderBookings(): Promise<
  ProviderBooking[]
> {
  const { data } = await providerApi.get<ProviderBookingListResponse>(
    "/bookings/provider/available",
  );

  return data.bookings;
}

export async function getAssignedProviderBookings(): Promise<
  ProviderBooking[]
> {
  const { data } = await providerApi.get<ProviderBookingListResponse>(
    "/bookings/provider/assigned",
  );

  return data.bookings;
}

export async function getProviderBookingDetails(
  bookingId: number,
): Promise<ProviderBookingDetails> {
  const { data } = await providerApi.get<ProviderBookingDetailsResponse>(
    `/bookings/provider/${bookingId}`,
  );

  return data.booking;
}

export async function acceptProviderBooking(
  bookingId: number,
): Promise<ProviderBooking | null> {
  const { data } = await providerApi.patch<{
    message: string;
    booking: ProviderBooking | null;
  }>(`/bookings/provider/${bookingId}/accept`);

  return data.booking;
}

export async function rejectProviderBooking(bookingId: number): Promise<void> {
  await providerApi.post(`/bookings/provider/${bookingId}/reject`);
}
export async function markProviderBookingTravelling(
  bookingId: number,
): Promise<ProviderBooking> {
  const { data } = await providerApi.patch<{
    message: string;
    booking: ProviderBooking;
  }>(`/bookings/provider/${bookingId}/travelling`);

  return data.booking;
}

export async function markProviderBookingArrived(
  bookingId: number,
): Promise<ProviderBooking> {
  const { data } = await providerApi.patch<{
    message: string;
    booking: ProviderBooking;
  }>(`/bookings/provider/${bookingId}/arrived`);

  return data.booking;
}

export async function startProviderBooking(
  bookingId: number,
): Promise<ProviderBooking> {
  const { data } = await providerApi.patch<{
    message: string;
    booking: ProviderBooking;
  }>(`/bookings/provider/${bookingId}/start`);

  return data.booking;
}

export async function completeProviderBooking(
  bookingId: number,
  finalPrice?: number,
): Promise<ProviderBooking> {
  const body =
    finalPrice !== undefined
      ? {
          finalPrice,
        }
      : {};

  const { data } = await providerApi.patch<{
    message: string;
    booking: ProviderBooking;
  }>(`/bookings/provider/${bookingId}/complete`, body);

  return data.booking;
}

export async function confirmProviderCashPaymentReceived(bookingId: number) {
  const { data } = await providerApi.post(
    `/payments/${bookingId}/cash/received`,
  );

  return data;
}

export async function setConsultationOutcome(
  bookingId: number,
  outcome: "resolved" | "needs_visit",
): Promise<void> {
  await providerApi.patch(
    `/bookings/provider/${bookingId}/consultation-outcome`,
    { outcome },
  );
}
