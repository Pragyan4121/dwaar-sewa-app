import { useCallback, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";

/*
|--------------------------------------------------------------------------
| useWebRTCCall
|--------------------------------------------------------------------------
|
| Owns the actual peer-to-peer media connection for a call — capturing
| the camera/mic, creating the offer/answer, exchanging ICE candidates,
| and exposing the resulting local/remote streams for the UI to render.
|
| This is deliberately NOT responsible for the call's ringing/accepted/
| rejected state machine — the chat screens already own that (via
| socket events like call:incoming, call:accepted, call:end). This hook
| only needs to be told "start sending media now, as the caller/callee"
| and "a remote offer/answer/candidate arrived" — the screen wires those
| calls to the right points in its existing state machine.
|
| STUN-only (Google's public server) by default — this is enough for two
| devices on reasonably open networks, but calls between some real-world
| network combinations (e.g. two different carriers' mobile data, or a
| restrictive corporate wifi) will fail to connect without a TURN server
| as a fallback relay. Add one by including it in ICE_SERVERS below —
| services like Twilio, Cloudflare, or metered.ca all offer a TURN
| endpoint; a few free tiers exist for low volume.
|--------------------------------------------------------------------------
*/

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // TODO: add a TURN server here before relying on this for real-world
  // calls across arbitrary networks — see the comment above.
];

export type CallMediaType = "audio" | "video";

/*
 * react-native-webrtc's own package types (not lib.dom's, which are
 * looser — e.g. lib.dom's RTCSessionDescriptionInit.sdp is optional,
 * but a real offer/answer we send or receive over the socket always has
 * one) and doesn't re-export its *Init helper types from the package
 * root, just the classes. These match the actual wire shape this app
 * sends/receives via Socket.IO.
 */
interface SessionDescriptionPayload {
  sdp: string;
  type: string;
}

interface IceCandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

interface UseWebRTCCallOptions {
  socketRef: React.RefObject<Socket | null>;
  bookingId: number;
  activeCallIdRef: React.RefObject<string | null>;
  onRemoteHangup?: () => void;
}

export function useWebRTCCall({
  socketRef,
  bookingId,
  activeCallIdRef,
}: UseWebRTCCallOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "failed"
  >("idle");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);

  const pendingRemoteCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const hasSetRemoteDescriptionRef = useRef(false);

  function emitSignal(event: string, data: Record<string, unknown>) {
    const socket = socketRef.current;

    const callId = activeCallIdRef.current;

    if (!socket || !socket.connected || !callId) {
      return;
    }

    socket.emit(event, {
      bookingId,
      callId,
      ...data,
    });
  }

  function createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // @ts-expect-error — react-native-webrtc's event typings don't
    // perfectly match the lib.dom RTCPeerConnection event shapes this
    // project's tsconfig expects, but the runtime payload is correct.
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitSignal("call:ice-candidate", { candidate: event.candidate });
      }
    };

    // @ts-expect-error — see above.
    pc.ontrack = (event) => {
      const [incomingStream] = event.streams as MediaStream[];

      if (incomingStream) {
        setRemoteStream(incomingStream);
      }
    };

    //ts-expect-error—seeabove.
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      if (state === "connected") {
        setConnectionState("connected");
      } else if (state === "failed" || state === "closed") {
        setConnectionState("failed");
      } else if (state === "connecting") {
        setConnectionState("connecting");
      }
    };

    peerConnectionRef.current = pc;

    return pc;
  }

  async function captureLocalMedia(
    callType: CallMediaType,
  ): Promise<MediaStream> {
    const stream = (await mediaDevices.getUserMedia({
      audio: true,
      video:
        callType === "video"
          ? {
              facingMode: "user",
            }
          : false,
    })) as unknown as MediaStream;

    localStreamRef.current = stream;

    setLocalStream(stream);

    setIsVideoEnabled(callType === "video");

    return stream;
  }

  function attachLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }

  async function flushPendingCandidates(pc: RTCPeerConnection) {
    const pending = pendingRemoteCandidatesRef.current;

    pendingRemoteCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error("Failed to add buffered ICE candidate:", error);
      }
    }
  }

  /**
   * Call once this side is the one who initiated the call (startFreeCall
   * in the chat screens) AND the other side has accepted
   * (call:accepted). Captures local media, creates the connection, and
   * sends the offer.
   */
  const startAsCaller = useCallback(
    async (callType: CallMediaType) => {
      try {
        setConnectionState("connecting");

        const stream = await captureLocalMedia(callType);

        const pc = createPeerConnection();

        attachLocalTracks(pc, stream);

        const offer = await pc.createOffer({});

        await pc.setLocalDescription(offer);

        emitSignal("call:offer", { offer, callType });
      } catch (error) {
        console.error("startAsCaller error:", error);

        setConnectionState("failed");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingId],
  );

  /**
   * Call once this side has accepted an incoming call (acceptIncomingCall
   * in the chat screens), before the remote offer necessarily arrives.
   * Captures local media and creates the connection so it's ready to
   * receive the offer.
   */
  const startAsCallee = useCallback(async (callType: CallMediaType) => {
    try {
      setConnectionState("connecting");

      const stream = await captureLocalMedia(callType);

      const pc = createPeerConnection();

      attachLocalTracks(pc, stream);
    } catch (error) {
      console.error("startAsCallee error:", error);

      setConnectionState("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoteOffer = useCallback(
    async (offer: SessionDescriptionPayload) => {
      const pc = peerConnectionRef.current;

      if (!pc) {
        // startAsCallee hasn't finished (or wasn't called) yet — this
        // shouldn't normally happen given the screens' ordering, but
        // bail out safely rather than crash.
        console.error("Received offer with no active peer connection");

        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        hasSetRemoteDescriptionRef.current = true;

        await flushPendingCandidates(pc);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        emitSignal("call:answer", { answer });
      } catch (error) {
        console.error("handleRemoteOffer error:", error);

        setConnectionState("failed");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingId],
  );

  const handleRemoteAnswer = useCallback(
    async (answer: SessionDescriptionPayload) => {
      const pc = peerConnectionRef.current;

      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        hasSetRemoteDescriptionRef.current = true;

        await flushPendingCandidates(pc);
      } catch (error) {
        console.error("handleRemoteAnswer error:", error);

        setConnectionState("failed");
      }
    },
    [],
  );

  const handleRemoteIceCandidate = useCallback(
    async (candidateInit: IceCandidatePayload) => {
      const pc = peerConnectionRef.current;

      const candidate = new RTCIceCandidate(candidateInit);

      if (!pc) {
        return;
      }

      if (!hasSetRemoteDescriptionRef.current) {
        // The remote description (offer/answer) can arrive after some
        // ICE candidates do, depending on network timing — buffer until
        // it's set rather than dropping them.
        pendingRemoteCandidatesRef.current.push(candidate);

        return;
      }

      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    },
    [],
  );

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextMuted = !isMuted;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextEnabled = !isVideoEnabled;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setIsVideoEnabled(nextEnabled);
  }, [isVideoEnabled]);

  const switchCamera = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const videoTrack = stream.getVideoTracks()[0] as unknown as
      | { _switchCamera?: () => void }
      | undefined;

    videoTrack?._switchCamera?.();
  }, []);

  const endCall = useCallback(() => {
    const stream = localStreamRef.current;

    stream?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;

    setLocalStream(null);

    setRemoteStream(null);

    peerConnectionRef.current?.close();

    peerConnectionRef.current = null;

    pendingRemoteCandidatesRef.current = [];

    hasSetRemoteDescriptionRef.current = false;

    setIsMuted(false);

    setIsVideoEnabled(true);

    setConnectionState("idle");
  }, []);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    connectionState,
    startAsCaller,
    startAsCallee,
    handleRemoteOffer,
    handleRemoteAnswer,
    handleRemoteIceCandidate,
    toggleMute,
    toggleVideo,
    switchCamera,
    endCall,
  };
}
