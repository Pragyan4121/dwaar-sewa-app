import { router, usePathname } from "expo-router";

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AppState,
  type AppStateStatus,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { Check, MessageCircle, Phone, PhoneOff } from "lucide-react-native";

import { io, type Socket } from "socket.io-client";

import { getToken } from "@/api/storage";
import { getProviderToken } from "@/api/provider-storage";

type CallRole = "customer" | "provider";

type GlobalCallStatus = "idle" | "incoming" | "accepted";

interface IncomingCallPayload {
  callId?: string;

  bookingId?: number;

  callerUserId?: number;

  callerRole?: CallRole;

  callerName?: string;

  caller_name?: string;

  recipientUserId?: number;

  recipientRole?: CallRole;

  callType?: string;

  startedAt?: string;
}

interface CallEndPayload {
  callId?: string;

  bookingId?: number;

  reason?: string;
}

interface CallActionResult {
  ok?: boolean;

  callId?: string;

  bookingId?: number;

  status?: string;

  code?: string;

  message?: string;
}

interface ActiveGlobalCall {
  callId: string;

  bookingId: number;

  recipientRole: CallRole;

  callerRole: CallRole;

  callerName: string;

  status: GlobalCallStatus;
}

interface CallProviderProps {
  children: ReactNode;
}

function getSocketBaseUrl() {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

  return apiBaseUrl.replace(/\/api\/?$/, "");
}

function isValidBookingId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidCallId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCallRole(value: unknown): value is CallRole {
  return value === "customer" || value === "provider";
}

export function CallProvider({ children }: CallProviderProps) {
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);

  const customerSocketRef = useRef<Socket | null>(null);

  const providerSocketRef = useRef<Socket | null>(null);

  const customerTokenRef = useRef<string | null>(null);

  const providerTokenRef = useRef<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const activeCallRef = useRef<ActiveGlobalCall | null>(null);

  const [activeCall, setActiveCall] = useState<ActiveGlobalCall | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const setGlobalCall = useCallback((call: ActiveGlobalCall | null) => {
    activeCallRef.current = call;

    setActiveCall(call);
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  /*
  |--------------------------------------------------------------------------
  | Is relevant chat already open?
  |--------------------------------------------------------------------------
  */

  const isRelevantChatCurrentlyOpen = useCallback(
    (
      role: CallRole,

      bookingId: number,
    ) => {
      const currentPath = pathnameRef.current;

      if (role === "customer") {
        return currentPath === `/chat/${bookingId}`;
      }

      return currentPath === `/provider/chat/${bookingId}`;
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | Get socket for role
  |--------------------------------------------------------------------------
  */

  const getRoleSocket = useCallback((role: CallRole) => {
    if (role === "customer") {
      return customerSocketRef.current;
    }

    return providerSocketRef.current;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Clear global call
  |--------------------------------------------------------------------------
  */

  const clearCall = useCallback(() => {
    setGlobalCall(null);

    setErrorMessage("");
  }, [setGlobalCall]);

  /*
  |--------------------------------------------------------------------------
  | Incoming call
  |--------------------------------------------------------------------------
  */

  const handleIncomingCall = useCallback(
    (
      payload: IncomingCallPayload,

      receivingRole: CallRole,
    ) => {
      const callId = payload?.callId;

      const bookingId = Number(payload?.bookingId);

      if (!isValidCallId(callId) || !isValidBookingId(bookingId)) {
        return;
      }

      if (payload.recipientRole && payload.recipientRole !== receivingRole) {
        return;
      }

      /*
       * Chat screen already handles its own incoming call.
       */
      if (
        isRelevantChatCurrentlyOpen(
          receivingRole,

          bookingId,
        )
      ) {
        return;
      }

      if (activeCallRef.current) {
        return;
      }

      const callerRole: CallRole = isCallRole(payload.callerRole)
        ? payload.callerRole
        : receivingRole === "customer"
          ? "provider"
          : "customer";

      const callerName =
        typeof payload.callerName === "string" && payload.callerName.trim()
          ? payload.callerName.trim()
          : typeof payload.caller_name === "string" &&
              payload.caller_name.trim()
            ? payload.caller_name.trim()
            : callerRole === "provider"
              ? "Provider"
              : "Customer";

      setErrorMessage("");

      setGlobalCall({
        callId,

        bookingId,

        recipientRole: receivingRole,

        callerRole,

        callerName,

        status: "incoming",
      });
    },
    [isRelevantChatCurrentlyOpen, setGlobalCall],
  );

  /*
  |--------------------------------------------------------------------------
  | Call ended
  |--------------------------------------------------------------------------
  */

  const handleCallEnded = useCallback(
    (payload: CallEndPayload) => {
      const current = activeCallRef.current;

      if (!current) {
        return;
      }

      if (payload.callId && payload.callId !== current.callId) {
        return;
      }

      if (
        payload.bookingId &&
        Number(payload.bookingId) !== current.bookingId
      ) {
        return;
      }

      clearCall();
    },
    [clearCall],
  );

  /*
  |--------------------------------------------------------------------------
  | Create global socket
  |--------------------------------------------------------------------------
  */

  const createRoleSocket = useCallback(
    (
      role: CallRole,

      token: string,
    ) => {
      const socket = io(getSocketBaseUrl(), {
        auth: {
          token,
        },

        transports: ["websocket", "polling"],

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000,
      });

      socket.on("connect", () => {
        console.log(`Global call socket connected: ${role}`);
      });

      socket.on("connect_error", (error) => {
        console.warn(`Global ${role} call socket error:`, error.message);
      });

      socket.on("call:incoming", (payload: IncomingCallPayload) => {
        handleIncomingCall(
          payload,

          role,
        );
      });

      socket.on("call:end", (payload: CallEndPayload) => {
        handleCallEnded(payload);
      });

      return socket;
    },
    [handleCallEnded, handleIncomingCall],
  );

  /*
  |--------------------------------------------------------------------------
  | Customer socket
  |--------------------------------------------------------------------------
  */

  const connectCustomerSocket = useCallback(async () => {
    const token = await getToken();

    if (!token) {
      customerTokenRef.current = null;

      customerSocketRef.current?.disconnect();

      customerSocketRef.current = null;

      return;
    }

    if (customerTokenRef.current === token && customerSocketRef.current) {
      if (!customerSocketRef.current.connected) {
        customerSocketRef.current.connect();
      }

      return;
    }

    customerSocketRef.current?.removeAllListeners();

    customerSocketRef.current?.disconnect();

    customerTokenRef.current = token;

    customerSocketRef.current = createRoleSocket(
      "customer",

      token,
    );
  }, [createRoleSocket]);

  /*
  |--------------------------------------------------------------------------
  | Provider socket
  |--------------------------------------------------------------------------
  */

  const connectProviderSocket = useCallback(async () => {
    const token = await getProviderToken();

    if (!token) {
      providerTokenRef.current = null;

      providerSocketRef.current?.disconnect();

      providerSocketRef.current = null;

      return;
    }

    if (providerTokenRef.current === token && providerSocketRef.current) {
      if (!providerSocketRef.current.connected) {
        providerSocketRef.current.connect();
      }

      return;
    }

    providerSocketRef.current?.removeAllListeners();

    providerSocketRef.current?.disconnect();

    providerTokenRef.current = token;

    providerSocketRef.current = createRoleSocket(
      "provider",

      token,
    );
  }, [createRoleSocket]);

  /*
  |--------------------------------------------------------------------------
  | Initial connections
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void connectCustomerSocket();

    void connectProviderSocket();

    return () => {
      customerSocketRef.current?.removeAllListeners();

      customerSocketRef.current?.disconnect();

      providerSocketRef.current?.removeAllListeners();

      providerSocketRef.current?.disconnect();

      customerSocketRef.current = null;

      providerSocketRef.current = null;
    };
  }, [connectCustomerSocket, connectProviderSocket]);

  /*
  |--------------------------------------------------------------------------
  | App state handling
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appStateRef.current;

      appStateRef.current = nextState;

      if (previous !== "active" && nextState === "active") {
        void connectCustomerSocket();

        void connectProviderSocket();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connectCustomerSocket, connectProviderSocket]);

  /*
  |--------------------------------------------------------------------------
  | Accept call
  |--------------------------------------------------------------------------
  */

  function acceptIncomingCall() {
    const call = activeCallRef.current;

    if (!call) {
      return;
    }

    const socket = getRoleSocket(call.recipientRole);

    if (!socket || !socket.connected) {
      setErrorMessage("Live connection is not ready. Please try again.");

      return;
    }

    socket.emit(
      "call:accept",

      {
        bookingId: call.bookingId,

        callId: call.callId,
      },

      (result: CallActionResult) => {
        if (!result?.ok) {
          setErrorMessage(result?.message ?? "Unable to accept the call.");

          return;
        }

        setErrorMessage("");

        setGlobalCall({
          ...call,

          status: "accepted",
        });

        if (call.recipientRole === "customer") {
          router.push(`/chat/${call.bookingId}`);

          return;
        }

        router.push({
          pathname: "/provider/chat/[id]",

          params: {
            id: String(call.bookingId),
          },
        });
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Reject call
  |--------------------------------------------------------------------------
  */

  function rejectIncomingCall() {
    const call = activeCallRef.current;

    if (!call) {
      return;
    }

    const socket = getRoleSocket(call.recipientRole);

    if (!socket || !socket.connected) {
      clearCall();

      return;
    }

    socket.emit(
      "call:reject",

      {
        bookingId: call.bookingId,

        callId: call.callId,
      },

      () => {
        clearCall();
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | End accepted call
  |--------------------------------------------------------------------------
  */

  function endAcceptedCall() {
    const call = activeCallRef.current;

    if (!call) {
      return;
    }

    const socket = getRoleSocket(call.recipientRole);

    if (!socket || !socket.connected) {
      clearCall();

      return;
    }

    socket.emit(
      "call:end",

      {
        bookingId: call.bookingId,

        callId: call.callId,
      },

      () => {
        clearCall();
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Open chat
  |--------------------------------------------------------------------------
  */

  function openCallChat() {
    const call = activeCallRef.current;

    if (!call) {
      return;
    }

    if (call.recipientRole === "customer") {
      router.push(`/chat/${call.bookingId}`);

      return;
    }

    router.push({
      pathname: "/provider/chat/[id]",

      params: {
        id: String(call.bookingId),
      },
    });
  }

  const callerTitle = activeCall?.callerName || "Caller";

  return (
    <>
      {children}

      <Modal
        visible={activeCall !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (activeCall?.status === "incoming") {
            rejectIncomingCall();

            return;
          }

          endAcceptedCall();
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-sm items-center rounded-3xl bg-white px-6 py-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Phone size={34} color="#16A34A" />
            </View>

            {activeCall?.status === "incoming" ? (
              <>
                <Text className="mt-5 text-sm font-semibold uppercase tracking-wide text-green-700">
                  Incoming Free Call
                </Text>

                <Text className="mt-2 text-xl font-bold text-gray-900">
                  {callerTitle}
                </Text>

                <Text className="mt-2 text-center text-sm text-gray-500">
                  Dwaar Sewa internet call
                </Text>

                {errorMessage ? (
                  <Text className="mt-3 text-center text-sm text-red-600">
                    {errorMessage}
                  </Text>
                ) : null}

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
              </>
            ) : (
              <>
                <Text className="mt-5 text-xl font-bold text-gray-900">
                  {callerTitle}
                </Text>

                <Text className="mt-2 text-center text-sm font-medium text-green-700">
                  Free Call connected
                </Text>

                <Text className="mt-1 text-center text-xs text-gray-500">
                  Booking #{activeCall?.bookingId}
                </Text>

                {errorMessage ? (
                  <Text className="mt-3 text-center text-sm text-red-600">
                    {errorMessage}
                  </Text>
                ) : null}

                <View className="mt-8 flex-row items-center">
                  <View className="items-center">
                    <Pressable
                      className="h-16 w-16 items-center justify-center rounded-full bg-gray-100"
                      onPress={openCallChat}
                    >
                      <MessageCircle size={27} color="#374151" />
                    </Pressable>

                    <Text className="mt-2 text-sm font-semibold text-gray-700">
                      Chat
                    </Text>
                  </View>

                  <View className="mx-8 items-center">
                    <Pressable
                      className="h-16 w-16 items-center justify-center rounded-full bg-red-600"
                      onPress={endAcceptedCall}
                    >
                      <PhoneOff size={27} color="#FFFFFF" />
                    </Pressable>

                    <Text className="mt-2 text-sm font-semibold text-red-600">
                      End
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
