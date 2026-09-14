import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import api from "@/api/client";

import type { BookingDetails, PaymentMethod } from "@/types";

import { safeBack } from "@/utils/navigation";

import { WebView } from "react-native-webview";

type OnlinePaymentMethod = "esewa" | "khalti" | "connectips";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  esewa: "eSewa",
  khalti: "Khalti",
  connectips: "Connect IPS",
};

function isOnlinePaymentMethod(value: unknown): value is OnlinePaymentMethod {
  return value === "esewa" || value === "khalti" || value === "connectips";
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    method?: string | string[];
    result?: string | string[];
  }>();

  const router = useRouter();

  const bookingId = useMemo(() => {
    const rawId = typeof params.id === "string" ? params.id : params.id?.[0];

    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return null;
    }

    return parsedId;
  }, [params.id]);

  const method = useMemo<OnlinePaymentMethod | null>(() => {
    const rawMethod =
      typeof params.method === "string" ? params.method : params.method?.[0];

    return isOnlinePaymentMethod(rawMethod) ? rawMethod : null;
  }, [params.method]);

  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const [startingPayment, setStartingPayment] = useState(false);

  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [esewaCheckoutHtml, setEsewaCheckoutHtml] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!bookingId) {
      setError("Invalid booking ID.");
      setLoading(false);
      return;
    }

    void loadBooking(bookingId);
  }, [bookingId]);

  useEffect(() => {
    const rawResult =
      typeof params.result === "string" ? params.result : params.result?.[0];

    if (
      !bookingId ||
      !method ||
      !booking ||
      booking.payments?.payment_status === "paid"
    ) {
      return;
    }

    if (rawResult === "success" || rawResult === "return") {
      void verifyReturnedPayment();
    }

    if (rawResult === "failed") {
      setMessage(
        "Payment was not completed. Your payment is still Pending and you can try again.",
      );
    }
  }, [params.result, bookingId, method, booking]);

  async function loadBooking(targetBookingId: number) {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get<{
        booking: BookingDetails;
      }>(`/bookings/${targetBookingId}`);

      setBooking(data.booking);
    } catch (error: any) {
      console.error("Load payment booking error:", error);

      setError(
        error?.response?.data?.message ?? "Unable to load payment details.",
      );
    } finally {
      setLoading(false);
    }
  }
  function buildEsewaCheckoutHtml(
    paymentUrl: string,
    form: Record<string, string>,
  ): string {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const inputs = Object.entries(form)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(
            String(value),
          )}" />`,
      )
      .join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body>
        <form
          id="esewa-payment-form"
          method="POST"
          action="${escapeHtml(paymentUrl)}"
        >
          ${inputs}
        </form>

        <script>
          document.getElementById("esewa-payment-form").submit();
        </script>
      </body>
    </html>
  `;
  }
  async function handleStartPayment() {
    if (
      bookingId === null ||
      booking === null ||
      method === null ||
      startingPayment
    ) {
      return;
    }

    try {
      setStartingPayment(true);
      setError(null);
      setMessage(null);

      const { data } = await api.post<{
        gateway?: string;
        payment_url?: string;
        form?: Record<string, string>;
      }>(`/payments/${bookingId}/${method}/initiate`);

      /*
      |--------------------------------------------------------------------------
      | eSewa
      |--------------------------------------------------------------------------
      |
      | eSewa V2 checkout requires a POST form.
      |--------------------------------------------------------------------------
      */

      if (method === "esewa") {
        if (!data.payment_url || !data.form) {
          throw new Error("Invalid eSewa payment response.");
        }

        if (Platform.OS === "web") {
          const paymentForm = document.createElement("form");

          paymentForm.method = "POST";
          paymentForm.action = data.payment_url;

          Object.entries(data.form).forEach(([key, value]) => {
            const input = document.createElement("input");

            input.type = "hidden";
            input.name = key;
            input.value = String(value);

            paymentForm.appendChild(input);
          });

          document.body.appendChild(paymentForm);

          paymentForm.submit();

          return;
        }

        setEsewaCheckoutHtml(
          buildEsewaCheckoutHtml(data.payment_url, data.form),
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Khalti / ConnectIPS
      |--------------------------------------------------------------------------
      */

      if (!data.payment_url) {
        throw new Error("Payment gateway URL was not returned.");
      }

      const canOpen = await Linking.canOpenURL(data.payment_url);

      if (!canOpen) {
        throw new Error("Unable to open the payment gateway.");
      }

      await Linking.openURL(data.payment_url);
    } catch (error: any) {
      console.error("Start online payment error:", error);

      setError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to start payment.",
      );
    } finally {
      setStartingPayment(false);
    }
  }
  async function verifyReturnedPayment() {
    if (
      bookingId === null ||
      method === null ||
      booking === null ||
      verifyingPayment
    ) {
      return;
    }

    try {
      setVerifyingPayment(true);
      setError(null);
      setMessage("Verifying payment...");

      const { data } = await api.post<{
        verified?: boolean;
        payment_status?: string;
        gateway_status?: string;
        message?: string;
      }>(`/payments/${bookingId}/${method}/verify`, {});

      if (data.verified && data.payment_status === "paid") {
        setMessage("Payment verified successfully.");

        router.replace(`/booking/${bookingId}`);

        return;
      }

      setMessage(
        data.message ??
          "Payment has not been completed yet. You can try again.",
      );

      await loadBooking(bookingId);
    } catch (error: any) {
      console.error("Verify returned payment error:", error);

      setError(
        error?.response?.data?.message ?? "Unable to verify the payment.",
      );
    } finally {
      setVerifyingPayment(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <View className="w-16 h-16 rounded-[22px] bg-white border border-[#E7ECF2] items-center justify-center">
          <ActivityIndicator size="small" color="#3563E9" />
        </View>

        <Text className="text-[#64748B] text-xs mt-3">
          Loading payment details...
        </Text>
      </View>
    );
  }
  if (Platform.OS !== "web" && esewaCheckoutHtml) {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Pressable
            onPress={() => {
              setEsewaCheckoutHtml(null);
              setMessage(
                "Payment was not completed. Your payment is still Pending and you can try again.",
              );
            }}
          >
            <ArrowLeft size={22} color="#132F57" />
          </Pressable>

          <Text
            style={{
              marginLeft: 16,
              fontSize: 16,
              fontWeight: "700",
              color: "#132F57",
            }}
          >
            eSewa Payment
          </Text>
        </View>

        <WebView
          source={{ html: esewaCheckoutHtml }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          onShouldStartLoadWithRequest={(request) => {
            try {
              const url = new URL(request.url);

              const result = url.searchParams.get("result");

              if (result === "success" || result === "return") {
                setEsewaCheckoutHtml(null);

                setTimeout(() => {
                  void verifyReturnedPayment();
                }, 0);

                return false;
              }

              if (result === "failed") {
                setEsewaCheckoutHtml(null);

                setMessage(
                  "Payment was not completed. Your payment is still Pending and you can try again.",
                );

                return false;
              }
            } catch {
              // Continue normal WebView navigation.
            }

            return true;
          }}
          startInLoadingState
          renderLoading={() => (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFFFF",
              }}
            >
              <ActivityIndicator size="large" />
            </View>
          )}
        />
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Invalid / unavailable payment
  |--------------------------------------------------------------------------
  */

  if (bookingId === null || method === null || booking === null) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center px-5">
        <View className="w-full max-w-[480px] bg-white border border-[#E7ECF2] rounded-[28px] p-6 items-center">
          <View className="w-14 h-14 rounded-2xl bg-[#FFF1F2] items-center justify-center">
            <XCircle size={24} color="#DC2626" />
          </View>

          <Text className="text-[#132F57] text-xl font-extrabold text-center mt-4">
            Payment unavailable
          </Text>

          <Text className="text-[#64748B] text-sm leading-6 text-center mt-2">
            {error ?? "This payment could not be loaded."}
          </Text>

          <Pressable
            onPress={() => safeBack(router, "/(tabs)/bookings")}
            className="mt-6 w-full rounded-2xl bg-[#132F57] py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold">Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | From this point TypeScript knows these are NOT null
  |--------------------------------------------------------------------------
  */

  const currentBooking = booking;
  const currentBookingId = bookingId;
  const currentMethod = method;

  const payment = currentBooking.payments;

  const paymentStatus = payment?.payment_status ?? "pending";

  const alreadyPaid = paymentStatus === "paid";

  const amount =
    currentBooking.final_price ??
    currentBooking.estimated_price ??
    currentBooking.services.base_price;

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 620,
          alignSelf: "center",
        }}
        className="px-5"
      >
        {/* BACK */}

        <View className="pt-4">
          <Pressable
            onPress={() => safeBack(router, `/booking/${currentBookingId}`)}
            className="w-11 h-11 rounded-2xl bg-white border border-[#E7ECF2] items-center justify-center active:opacity-70"
          >
            <ArrowLeft size={19} color="#132F57" />
          </Pressable>
        </View>

        {/* HERO */}

        <View className="bg-[#132F57] rounded-[28px] p-5 mt-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
              <WalletCards size={22} color="#FFFFFF" />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-white/60 text-[10px] font-bold">
                BOOKING #{currentBooking.id}
              </Text>

              <Text className="text-white text-xl font-extrabold mt-1">
                Complete your payment
              </Text>

              <Text className="text-white/60 text-xs mt-1">
                {PAYMENT_METHOD_LABELS[currentMethod]}
              </Text>
            </View>
          </View>
        </View>

        {/* PAYMENT CARD */}

        <View className="bg-white border border-[#E7ECF2] rounded-[26px] p-5 mt-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-[#EEF4FF] items-center justify-center">
              <CreditCard size={18} color="#3563E9" />
            </View>

            <View className="ml-3">
              <Text className="text-[#132F57] text-sm font-extrabold">
                Payment details
              </Text>

              <Text className="text-[#64748B] text-[10px] mt-0.5">
                Secure online checkout
              </Text>
            </View>
          </View>

          <View className="bg-[#F8FAFC] rounded-2xl p-4 mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#64748B] text-xs">Payment method</Text>

              <Text className="text-[#132F57] text-xs font-extrabold">
                {PAYMENT_METHOD_LABELS[currentMethod]}
              </Text>
            </View>

            <View className="h-px bg-[#E7ECF2] my-4" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[#64748B] text-xs">Amount</Text>

              <Text className="text-[#132F57] text-lg font-extrabold">
                NPR {amount}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-[#64748B] text-xs">Status</Text>

              <View
                className={`px-3 py-1.5 rounded-full ${
                  alreadyPaid ? "bg-[#EAF8F1]" : "bg-[#FFF7E6]"
                }`}
              >
                <Text
                  className={`text-[10px] font-extrabold capitalize ${
                    alreadyPaid ? "text-[#159A64]" : "text-[#B7791F]"
                  }`}
                >
                  {paymentStatus}
                </Text>
              </View>
            </View>
          </View>

          {/* PENDING */}

          {!alreadyPaid ? (
            <View className="bg-[#EEF4FF] border border-[#D8E4FF] rounded-2xl p-4 mt-4">
              <Text className="text-[#1D4ED8] text-xs font-extrabold">
                Payment pending
              </Text>

              <Text className="text-[#3563E9] text-[10px] leading-5 mt-1">
                Your booking remains pending until the payment provider confirms
                a successful transaction. Failed or cancelled attempts will not
                be marked as paid.
              </Text>
            </View>
          ) : null}

          {/* PAID */}

          {alreadyPaid ? (
            <View className="bg-[#EAF8F1] border border-[#CDEBD9] rounded-2xl p-4 mt-4">
              <View className="flex-row items-center">
                <CheckCircle2 size={18} color="#159A64" />

                <View className="flex-1 ml-2">
                  <Text className="text-[#047857] text-xs font-extrabold">
                    Payment completed
                  </Text>

                  <Text className="text-[#047857] text-[10px] leading-5 mt-1">
                    Your payment has been successfully verified.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* MESSAGE */}

          {message ? (
            <View className="bg-[#EAF8F1] border border-[#CDEBD9] rounded-2xl p-4 mt-4">
              <Text className="text-[#047857] text-xs leading-5 font-semibold">
                {message}
              </Text>
            </View>
          ) : null}

          {/* ERROR */}

          {error ? (
            <View className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-4 mt-4">
              <Text className="text-[#BE123C] text-xs leading-5 font-semibold">
                {error}
              </Text>
            </View>
          ) : null}

          {/* PAY / RETRY */}

          {!alreadyPaid ? (
            <Pressable
              onPress={() => void handleStartPayment()}
              disabled={startingPayment || verifyingPayment}
              className={`rounded-2xl py-4 items-center flex-row justify-center mt-5 ${
                startingPayment
                  ? "bg-[#3563E9]/70"
                  : "bg-[#3563E9] active:opacity-80"
              }`}
            >
              {startingPayment || verifyingPayment ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <RefreshCw size={16} color="#FFFFFF" />

                  <Text className="text-white text-sm font-bold ml-2">
                    Pay with {PAYMENT_METHOD_LABELS[currentMethod]}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {/* SECURITY */}

          <View className="flex-row items-start mt-5">
            <ShieldCheck size={15} color="#159A64" />

            <Text className="flex-1 ml-2 text-[#64748B] text-[10px] leading-5">
              Dwaar Sewa does not mark an online payment as paid merely because
              the checkout page opened. Payment is confirmed only after backend
              gateway verification succeeds.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
