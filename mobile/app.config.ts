import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NEB School ERP",
  slug: "neb-school-erp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "nebschoolerp",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1E40AF",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nebschoolerp.mobile",
    infoPlist: {
      NSFaceIDUsageDescription:
        "Allow NEB School ERP to use Face ID for quick login",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1E40AF",
    },
    package: "com.nebschoolerp.mobile",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#1E40AF",
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow NEB School ERP to use Face ID for quick login",
      },
    ],
  ],
  extra: {
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1",
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || "http://localhost:3000",
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
