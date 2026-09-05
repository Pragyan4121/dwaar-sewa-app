import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Check,
  Phone,
  PhoneOff,
  Smartphone,
  Wifi,
  X,
} from "lucide-react-native";

import { io, Socket } from "socket.io-client";

import api from "@/api/client";
import { getToken } from "@/api/storage";

type ChatSenderRole = "customer" | "provider" | "system";

type ChatMessageType = "text" | "image" | "system";

type FreeCallStatus = "idle" | "starting" | "ringing" | "incoming" | "accepted";

interface ChatMessage {
  id: number;
  chat_room_id?: number;
  booking_id: number;
  sender_user_id: number | null;
  sender_role: ChatSenderRole;
  message_type: ChatMessageType;
  message_text: string | null;
  image_url: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

interface ChatParticipant {
  id?: number;
  full_name?: string | null;
  phone?: string | null;
}

interface BookingSummary {
  id: number;
  status: string;

  preferred_date?: string | null;
  preferred_time?: string | null;

  services?: {
    id?: number;
    name?: string | null;
  } | null;

  users_bookings_customer_idTousers?: ChatParticipant | null;

  users_bookings_provider_idTousers?: ChatParticipant | null;
}

interface ChatRoom {
  id: number;
  booking_id: number;
  customer_id: number;
  provider_id: number;

  activated_at: string | null;
  archived_at: string | null;

  created_at?: string;
  updated_at?: string;

  is_active?: boolean;
  is_archived?: boolean;
}

interface ChatPayload {
  room: ChatRoom | null;
  booking: BookingSummary | null;
  messages: ChatMessage[];
  provider: ChatParticipant | null;
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

interface StartCallCallback {
  ok?: boolean;
  callId?: string;
  bookingId?: number;
  status?: string;
  code?: string;
  message?: string;
}

interface CallActionCallback {
  ok?: boolean;
  callId?: string;
  bookingId?: number;
  status?: string;
  code?: string;
  message?: string;
}

interface CallSignalPayload {
  callId?: string;
  bookingId?: number;

  callerName?: string;
  caller_name?: string;

  message?: string;
  code?: string;
}

const ACTIVE_CHAT_STATUSES = [
  "accepted",
  "travelling",
  "arrived",
  "in_progress",
];

function getSocketBaseUrl() {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

  return apiBaseUrl.replace(/\/api\/?$/, "");
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;

  if (
    typeof source.id !== "number" ||
    typeof source.booking_id !== "number" ||
    typeof source.sender_role !== "string" ||
    typeof source.message_type !== "string" ||
    typeof source.created_at !== "string"
  ) {
    return null;
  }

  return source as unknown as ChatMessage;
}

function unwrapMessageFromSocket(payload: unknown): ChatMessage | null {
  const direct = normalizeMessage(payload);

  if (direct) {
    return direct;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;

  return (
    normalizeMessage(source.chat_message) ??
    normalizeMessage(source.message) ??
    normalizeMessage(source.chatMessage) ??
    normalizeMessage(source.data)
  );
}

function normalizeChatPayload(data: unknown): ChatPayload {
  const source =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const nested =
    source.chat && typeof source.chat === "object"
      ? (source.chat as Record<string, unknown>)
      : source;

  const rawMessages = Array.isArray(nested.messages) ? nested.messages : [];

  const messages = rawMessages
    .map(normalizeMessage)
    .filter((message): message is ChatMessage => message !== null)
    .sort(
      (first, second) =>
        new Date(first.created_at).getTime() -
        new Date(second.created_at).getTime(),
    );

  const booking = (nested.booking as BookingSummary | undefined) ?? null;

  const room =
    source.chat && typeof source.chat === "object"
      ? (source.chat as unknown as ChatRoom)
      : null;

  const provider = booking?.users_bookings_provider_idTousers ?? null;

  return {
    room,
    booking,
    messages,
    provider,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}

function upsertMessage(
  currentMessages: ChatMessage[],
  incomingMessage: ChatMessage,
) {
  const existingIndex = currentMessages.findIndex(
    (message) => message.id === incomingMessage.id,
  );

  if (existingIndex >= 0) {
    const next = [...currentMessages];

    next[existingIndex] = {
      ...next[existingIndex],
      ...incomingMessage,
    };

    return next;
  }

  return [...currentMessages, incomingMessage].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );
}

export default function CustomerChatScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const bookingId =
    typeof params.id === "string" ? Number(params.id) : Number.NaN;

  const [room, setRoom] = useState<ChatRoom | null>(null);

  const [booking, setBooking] = useState<BookingSummary | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [provider, setProvider] = useState<ChatParticipant | null>(null);

  const [messageText, setMessageText] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);

  const [isCalling, setIsCalling] = useState(false);

  const [callMenuVisible, setCallMenuVisible] = useState(false);

  const [freeCallStatus, setFreeCallStatus] = useState<FreeCallStatus>("idle");

  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const [incomingCallerName, setIncomingCallerName] = useState<string | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");

  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const activeCallIdRef = useRef<string | null>(null);

  const freeCallStatusRef = useRef<FreeCallStatus>("idle");

  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  const updateActiveCallId = useCallback((value: string | null) => {
    activeCallIdRef.current = value;
    setActiveCallId(value);
  }, []);

  const updateFreeCallStatus = useCallback((value: FreeCallStatus) => {
    freeCallStatusRef.current = value;
    setFreeCallStatus(value);
  }, []);

  const resetFreeCall = useCallback(() => {
    updateActiveCallId(null);
    updateFreeCallStatus("idle");
  }, [updateActiveCallId, updateFreeCallStatus]);

  const goToBooking = useCallback(() => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      router.replace("/(tabs)/bookings");

      return;
    }

    router.replace(`/booking/${bookingId}`);
  }, [bookingId]);

  const isActive = useMemo(() => {
    if (!booking) {
      return false;
    }

    return (
      ACTIVE_CHAT_STATUSES.includes(booking.status) && room?.archived_at == null
    );
  }, [booking, room]);

  const providerName = provider?.full_name?.trim() || "Service Provider";

  const serviceName =
    booking?.services?.name?.trim() ||
    `Booking #${Number.isFinite(bookingId) ? bookingId : ""}`;

  const loadChat = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setErrorMessage("Invalid booking ID.");

      setIsLoading(false);

      return;
    }

    try {
      setErrorMessage("");

      const { data } = await api.get(`/chats/orders/${bookingId}`);

      const parsed = normalizeChatPayload(data);

      setRoom(parsed.room);

      setBooking(parsed.booking);

      setMessages(parsed.messages);

      setProvider(parsed.provider);

      try {
        await api.patch(`/chats/orders/${bookingId}/read`);
      } catch (readError) {
        console.warn("Unable to mark customer chat as read:", readError);
      }
    } catch (error) {
      console.error("Load customer chat error:", error);

      setErrorMessage(getErrorMessage(error, "Unable to load this chat."));
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return;
    }

    let isDisposed = false;

    async function connectSocket() {
      const token = await getToken();

      if (!token || isDisposed) {
        return;
      }

      const socket = io(getSocketBaseUrl(), {
        auth: {
          token,
        },

        transports: ["websocket", "polling"],

        reconnection: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketConnected(true);

        socket.emit("chat:join", {
          bookingId,
        });
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.warn("Customer chat socket error:", error.message);

        setSocketConnected(false);
      });

      socket.on("chat:message", (payload: unknown) => {
        const incoming = unwrapMessageFromSocket(payload);

        if (!incoming || incoming.booking_id !== bookingId) {
          return;
        }

        setMessages((current) => upsertMessage(current, incoming));

        if (
          incoming.sender_role === "provider" &&
          incoming.sender_user_id !== null
        ) {
          socket.emit("chat:delivered", {
            bookingId,

            messageId: incoming.id,
          });

          void api.patch(`/chats/orders/${bookingId}/read`).catch((error) => {
            console.warn("Unable to mark provider message read:", error);
          });
        }
      });

      socket.on("chat:delivery-updated", (payload: unknown) => {
        if (!payload || typeof payload !== "object") {
          return;
        }

        const source = payload as Record<string, unknown>;

        const messageId =
          typeof source.messageId === "number"
            ? source.messageId
            : typeof source.id === "number"
              ? source.id
              : null;

        if (!messageId) {
          return;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? {
                  ...message,

                  delivered_at:
                    typeof source.deliveredAt === "string"
                      ? source.deliveredAt
                      : (message.delivered_at ?? new Date().toISOString()),
                }
              : message,
          ),
        );
      });

      socket.on("chat:read-updated", (payload: unknown) => {
        const readAt =
          payload &&
          typeof payload === "object" &&
          typeof (payload as Record<string, unknown>).readAt === "string"
            ? ((payload as Record<string, unknown>).readAt as string)
            : new Date().toISOString();

        setMessages((current) =>
          current.map((message) =>
            message.sender_role === "customer"
              ? {
                  ...message,

                  read_at: message.read_at ?? readAt,
                }
              : message,
          ),
        );
      });

      socket.on("chat:archived", (payload: unknown) => {
        if (payload && typeof payload === "object") {
          const source = payload as Record<string, unknown>;

          if (
            typeof source.bookingId === "number" &&
            source.bookingId !== bookingId
          ) {
            return;
          }
        }

        setRoom((current) =>
          current
            ? {
                ...current,
                archived_at: current.archived_at ?? new Date().toISOString(),
              }
            : current,
        );

        setMessages([]);

        setMessageText("");

        setCallMenuVisible(false);

        setErrorMessage(
          "This booking has ended. Chat history is no longer available.",
        );
      });
      /*
      |--------------------------------------------------------------------------
      | Incoming Free Call
      |--------------------------------------------------------------------------
      */

      socket.on("call:incoming", (payload: CallSignalPayload) => {
        if (Number(payload?.bookingId) !== bookingId) {
          return;
        }

        if (typeof payload.callId !== "string" || !payload.callId.trim()) {
          return;
        }

        const callerName =
          typeof payload.callerName === "string" && payload.callerName.trim()
            ? payload.callerName.trim()
            : typeof payload.caller_name === "string" &&
                payload.caller_name.trim()
              ? payload.caller_name.trim()
              : "Provider";

        setIncomingCallerName(callerName);

        setActiveCallId(payload.callId);

        setFreeCallStatus("incoming");

        setCallMenuVisible(false);

        setErrorMessage("");
      });

      /*
      |--------------------------------------------------------------------------
      | Free call accepted by provider
      |--------------------------------------------------------------------------
      */

      socket.on("call:accepted", (payload: CallSignalPayload) => {
        if (Number(payload?.bookingId) !== bookingId) {
          return;
        }

        const currentCallId = activeCallIdRef.current;

        if (
          currentCallId &&
          payload.callId &&
          payload.callId !== currentCallId
        ) {
          return;
        }

        if (payload.callId) {
          updateActiveCallId(payload.callId);
        }

        updateFreeCallStatus("accepted");
        setErrorMessage("");
      });

      /*
      |--------------------------------------------------------------------------
      | Provider rejected call
      |--------------------------------------------------------------------------
      */

      socket.on("call:rejected", (payload: CallSignalPayload) => {
        if (Number(payload?.bookingId) !== bookingId) {
          return;
        }

        resetFreeCall();
        setErrorMessage("The provider declined the Free Call.");
      });

      /*
      |--------------------------------------------------------------------------
      | Provider ended call
      |--------------------------------------------------------------------------
      */

      socket.on("call:end", (payload: CallSignalPayload) => {
        if (Number(payload?.bookingId) !== bookingId) {
          return;
        }

        resetFreeCall();
      });

      /*
       * WebRTC signaling listeners are registered now.
       *
       * We will use them in the next step when actual microphone/audio
       * WebRTC handling is added.
       */

      socket.on("call:offer", (payload) => {
        console.log("Customer received WebRTC offer:", payload);
      });

      socket.on("call:answer", (payload) => {
        console.log("Customer received WebRTC answer:", payload);
      });

      socket.on("call:ice-candidate", (payload) => {
        console.log("Customer received ICE candidate:", payload);
      });
    }

    void connectSocket();

    return () => {
      isDisposed = true;

      const socket = socketRef.current;

      if (socket) {
        socket.emit("chat:leave", {
          bookingId,
        });

        socket.removeAllListeners();

        socket.disconnect();
      }

      socketRef.current = null;

      setSocketConnected(false);
    };
  }, [
    bookingId,
    loadChat,
    resetFreeCall,
    updateActiveCallId,
    updateFreeCallStatus,
  ]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  async function sendMessage() {
    if (!isActive || isSending) {
      return;
    }

    const text = messageText.trim();

    if (!text) {
      return;
    }

    try {
      setIsSending(true);

      setErrorMessage("");

      const { data } = await api.post(`/chats/orders/${bookingId}/messages`, {
        message: text,
      });

      const source =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};

      const created =
        normalizeMessage(source.chat_message) ??
        normalizeMessage(source.message) ??
        normalizeMessage(source.data);

      if (created) {
        setMessages((current) => upsertMessage(current, created));
      } else {
        await loadChat();
      }

      setMessageText("");
    } catch (error) {
      console.error("Send customer chat message error:", error);

      setErrorMessage(getErrorMessage(error, "Unable to send the message."));
    } finally {
      setIsSending(false);
    }
  }

  async function makePhoneCall() {
    if (!isActive || isCalling) {
      return;
    }

    try {
      setCallMenuVisible(false);

      setIsCalling(true);

      setErrorMessage("");

      const { data } = await api.post(`/chats/orders/${bookingId}/calls`, {
        callType: "voice",

        call_type: "voice",
      });

      const source =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};

      let phone: string | null = null;

      if (source.recipient && typeof source.recipient === "object") {
        const recipient = source.recipient as Record<string, unknown>;

        if (typeof recipient.phone === "string") {
          phone = recipient.phone;
        }
      }

      if (!phone) {
        phone = provider?.phone ?? null;
      }

      if (!phone) {
        setErrorMessage("Provider phone number is not available.");

        return;
      }

      const normalizedPhone = phone.replace(/[^\d+]/g, "");

      const url = `tel:${normalizedPhone}`;

      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        setErrorMessage(
          Platform.OS === "web"
            ? "Mobile phone calling is not available in this browser. Open Dwaar Sewa on your phone to use Phone Call."
            : "Phone calling is not available on this device.",
        );

        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Customer provider phone call error:", error);

      setErrorMessage(
        getErrorMessage(error, "Unable to start the phone call."),
      );
    } finally {
      setIsCalling(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Start Free Call
  |--------------------------------------------------------------------------
  */

  function startFreeCall() {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setCallMenuVisible(false);

      setErrorMessage(
        "Live connection is not ready. Please wait a moment and try again.",
      );

      return;
    }

    if (!isActive) {
      return;
    }

    if (freeCallStatusRef.current !== "idle") {
      return;
    }

    setCallMenuVisible(false);
    setErrorMessage("");
    updateFreeCallStatus("starting");

    socket.emit(
      "call:start",
      {
        bookingId,
        callType: "audio",
      },
      (result: StartCallCallback) => {
        if (!result?.ok) {
          resetFreeCall();

          setErrorMessage(result?.message ?? "Unable to start Free Call.");

          return;
        }

        if (!result.callId) {
          resetFreeCall();

          setErrorMessage("Call started without a valid call ID.");

          return;
        }

        updateActiveCallId(result.callId);
        updateFreeCallStatus("ringing");
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Accept incoming Free Call
  |--------------------------------------------------------------------------
  */

  function acceptIncomingCall() {
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;

    if (!socket || !socket.connected || !callId) {
      resetFreeCall();

      setErrorMessage("The call is no longer available.");

      return;
    }

    socket.emit(
      "call:accept",
      {
        bookingId,
        callId,
      },
      (result: CallActionCallback) => {
        if (!result?.ok) {
          resetFreeCall();

          setErrorMessage(result?.message ?? "Unable to accept the call.");

          return;
        }

        updateFreeCallStatus("accepted");
        setErrorMessage("");
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Reject incoming Free Call
  |--------------------------------------------------------------------------
  */

  function rejectIncomingCall() {
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;

    if (!callId) {
      resetFreeCall();
      return;
    }

    if (!socket || !socket.connected) {
      resetFreeCall();
      return;
    }

    socket.emit(
      "call:reject",
      {
        bookingId,
        callId,
      },
      () => {
        resetFreeCall();
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel / end Free Call
  |--------------------------------------------------------------------------
  */

  function endFreeCall() {
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;

    if (!callId) {
      resetFreeCall();
      return;
    }

    if (!socket || !socket.connected) {
      resetFreeCall();
      return;
    }

    socket.emit(
      "call:end",
      {
        bookingId,
        callId,
      },
      () => {
        resetFreeCall();
      },
    );
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isCustomer = item.sender_role === "customer";

    const isSystem = item.sender_role === "system";

    if (isSystem) {
      return (
        <View className="my-3 items-center px-4">
          <View className="max-w-[92%] rounded-xl bg-gray-200 px-4 py-3">
            <Text className="text-center text-xs leading-5 text-gray-700">
              {item.message_text ?? "Booking update"}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className={`mb-3 px-4 ${isCustomer ? "items-end" : "items-start"}`}>
        <View
          className={`max-w-[82%] rounded-2xl px-4 py-3 ${
            isCustomer ? "rounded-br-md bg-primary" : "rounded-bl-md bg-white"
          }`}
        >
          <Text
            className={`text-base leading-6 ${
              isCustomer ? "text-white" : "text-gray-900"
            }`}
          >
            {item.message_text ?? ""}
          </Text>

          <View
            className={`mt-1 flex-row items-center ${
              isCustomer ? "justify-end" : "justify-start"
            }`}
          >
            <Text
              className={`text-[11px] ${
                isCustomer ? "text-white/80" : "text-gray-400"
              }`}
            >
              {formatTime(item.created_at)}
            </Text>

            {isCustomer && (
              <Text className="ml-2 text-[11px] text-white/80">
                {item.read_at
                  ? "Read"
                  : item.delivered_at
                    ? "Delivered"
                    : "Sent"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF5A3C" />

        <Text className="mt-3 text-sm text-gray-600">Loading chat...</Text>
      </SafeAreaView>
    );
  }

  if (!room || !booking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-center text-xl font-bold text-gray-900">
          Chat unavailable
        </Text>

        <Text className="mt-3 text-center text-sm leading-6 text-gray-600">
          {errorMessage ||
            "This chat has not been activated for this booking yet."}
        </Text>

        <Pressable
          className="mt-6 rounded-xl bg-primary px-6 py-4"
          onPress={goToBooking}
        >
          <Text className="font-bold text-white">Back to Booking</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}

        <View className="border-b border-gray-200 bg-primary px-4 pb-4 pt-3">
          <View className="flex-row items-center">
            <Pressable
              className="mr-3 rounded-full bg-white/15 px-4 py-2"
              onPress={goToBooking}
            >
              <Text className="font-semibold text-white">Back</Text>
            </Pressable>

            <View className="flex-1">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {providerName}
              </Text>

              <Text className="mt-0.5 text-xs text-white/80" numberOfLines={1}>
                {serviceName} · Booking #{booking.id}
              </Text>
            </View>

            {isActive && (
              <Pressable
                className="ml-3 h-11 w-11 items-center justify-center rounded-full bg-white"
                onPress={() => {
                  setErrorMessage("");

                  setCallMenuVisible(true);
                }}
                disabled={isCalling || freeCallStatus !== "idle"}
                accessibilityRole="button"
                accessibilityLabel="Call provider"
              >
                {isCalling ? (
                  <ActivityIndicator size="small" color="#FF5A3C" />
                ) : (
                  <Phone size={21} color="#FF5A3C" />
                )}
              </Pressable>
            )}
          </View>

          <View className="mt-3 flex-row items-center">
            <View
              className={`h-2 w-2 rounded-full ${
                socketConnected ? "bg-green-300" : "bg-gray-300"
              }`}
            />

            <Text className="ml-2 text-xs text-white/80">
              {socketConnected ? "Live chat connected" : "Connecting..."}
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="border-b border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm leading-5 text-red-700">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!isActive ? (
          <View className="border-b border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="text-center text-sm leading-5 text-amber-800">
              This booking is no longer active. Chat history is available, but
              new messages and calls are disabled.
            </Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          className="flex-1"
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingTop: 14,

            paddingBottom: 18,
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center px-6 py-12">
              <Text className="text-center text-sm text-gray-500">
                No messages yet.
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({
              animated: false,
            });
          }}
        />

        {isActive ? (
          <View className="border-t border-gray-200 bg-white px-3 py-3">
            <View className="flex-row items-end">
              <TextInput
                className="mr-2 max-h-28 min-h-12 flex-1 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-900"
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                multiline
                editable={!isSending}
                returnKeyType="default"
              />

              <Pressable
                className={`h-12 min-w-20 items-center justify-center rounded-xl px-4 ${
                  messageText.trim() && !isSending
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
                onPress={() => {
                  void sendMessage();
                }}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-white">Send</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {/* Call options */}

      <Modal
        visible={callMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallMenuVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setCallMenuVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-5 pb-8 pt-5"
            onPress={() => {}}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-gray-900">
                  Call {providerName}
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  Choose how you want to call
                </Text>
              </View>

              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                onPress={() => setCallMenuVisible(false)}
              >
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <Pressable
              className="mb-3 flex-row items-center rounded-2xl border border-green-200 bg-green-50 p-4"
              onPress={startFreeCall}
            >
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-green-600">
                <Wifi size={22} color="#FFFFFF" />
              </View>

              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  Free Call
                </Text>

                <Text className="mt-1 text-sm text-gray-600">
                  Call through Dwaar Sewa using internet
                </Text>
              </View>
            </Pressable>

            <Pressable
              className="flex-row items-center rounded-2xl border border-gray-200 bg-white p-4"
              onPress={() => {
                void makePhoneCall();
              }}
              disabled={isCalling}
            >
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Smartphone size={22} color="#FFFFFF" />
              </View>

              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  Phone Call
                </Text>

                <Text className="mt-1 text-sm text-gray-600">
                  Call using your mobile network
                </Text>
              </View>
            </Pressable>

            <Pressable
              className="mt-4 h-12 items-center justify-center rounded-xl bg-gray-100"
              onPress={() => setCallMenuVisible(false)}
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Incoming Free Call */}

      <Modal
        visible={freeCallStatus === "incoming"}
        transparent
        animationType="fade"
        onRequestClose={rejectIncomingCall}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-sm items-center rounded-3xl bg-white px-6 py-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Phone size={34} color="#16A34A" />
            </View>

            <Text className="mt-5 text-sm font-semibold uppercase tracking-wide text-green-700">
              Incoming Free Call
            </Text>

            <Text className="mt-2 text-xl font-bold text-gray-900">
              {incomingCallerName || providerName}
            </Text>

            <Text className="mt-2 text-center text-sm text-gray-500">
              Dwaar Sewa internet call
            </Text>

            <View className="mt-8 flex-row items-center">
              <View className="items-center">
                <Pressable
                  className="h-16 w-16 items-center justify-center rounded-full bg-red-600"
                  onPress={rejectIncomingCall}
                >
                  <PhoneOff size={27} color="#FFFFFF" />
                </Pressable>

                <Text className="mt-2 text-sm font-semibold text-red-600">
                  Reject
                </Text>
              </View>

              <View className="mx-8 items-center">
                <Pressable
                  className="h-16 w-16 items-center justify-center rounded-full bg-green-600"
                  onPress={acceptIncomingCall}
                >
                  <Check size={29} color="#FFFFFF" />
                </Pressable>

                <Text className="mt-2 text-sm font-semibold text-green-700">
                  Accept
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Outgoing / accepted Free Call */}

      <Modal
        visible={
          freeCallStatus === "starting" ||
          freeCallStatus === "ringing" ||
          freeCallStatus === "accepted"
        }
        transparent
        animationType="fade"
        onRequestClose={endFreeCall}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-sm items-center rounded-3xl bg-white px-6 py-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-green-100">
              {freeCallStatus === "starting" ? (
                <ActivityIndicator size="large" color="#16A34A" />
              ) : (
                <Phone size={34} color="#16A34A" />
              )}
            </View>

            <Text className="mt-5 text-xl font-bold text-gray-900">
              {providerName}
            </Text>

            <Text className="mt-2 text-center text-sm text-gray-500">
              {freeCallStatus === "starting"
                ? "Starting Free Call..."
                : freeCallStatus === "ringing"
                  ? "Calling provider..."
                  : "Provider accepted"}
            </Text>

            {freeCallStatus === "accepted" && (
              <Text className="mt-2 text-center text-xs text-gray-400">
                Audio connection will be enabled in the next WebRTC step.
              </Text>
            )}

            <Pressable
              className="mt-8 h-16 w-16 items-center justify-center rounded-full bg-red-600"
              onPress={endFreeCall}
            >
              <PhoneOff size={28} color="#FFFFFF" />
            </Pressable>

            <Text className="mt-3 text-sm font-semibold text-red-600">
              {freeCallStatus === "accepted" ? "End Call" : "Cancel"}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
