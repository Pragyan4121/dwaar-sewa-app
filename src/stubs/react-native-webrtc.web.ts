/*
|--------------------------------------------------------------------------
| react-native-webrtc — web stub
|--------------------------------------------------------------------------
|
| react-native-webrtc is a native-only module (it needs iOS/Android native
| code), so importing it in a web build crashes the bundler. metro.config.js
| redirects "react-native-webrtc" to this file when bundling for web.
|
| Video/voice calls are a phone-app feature. On web these exports exist only
| so the app's screens can load; trying to start a call rejects with a clear
| message instead of crashing the page.
|
*/

import type { ReactElement } from "react";

const UNSUPPORTED_MESSAGE =
  "Video and voice calls are only available in the Dwaar Sewa mobile app.";

class UnsupportedWebRTCClass {
  constructor() {
    throw new Error(UNSUPPORTED_MESSAGE);
  }
}

export const MediaStream = UnsupportedWebRTCClass;
export const RTCIceCandidate = UnsupportedWebRTCClass;
export const RTCPeerConnection = UnsupportedWebRTCClass;
export const RTCSessionDescription = UnsupportedWebRTCClass;

export const mediaDevices = {
  getUserMedia: (): Promise<never> =>
    Promise.reject(new Error(UNSUPPORTED_MESSAGE)),
};

export function RTCView(): ReactElement | null {
  return null;
}

export default {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
};
