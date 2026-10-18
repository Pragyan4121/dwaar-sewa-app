const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/*
| react-native-webrtc only works on iOS/Android. For the web build
| (`expo export --platform web`) swap it for a harmless stub so the
| bundler doesn't try to load native code.
*/
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-webrtc") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "src/stubs/react-native-webrtc.web.ts"),
    };
  }

  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = withNativeWind(config, { input: "./global.css" });
