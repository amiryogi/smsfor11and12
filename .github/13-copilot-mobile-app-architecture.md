# Context: Mobile App Architecture & Project Setup

## Domain: NEB +2 School Management ERP — React Native Expo

This document defines the React Native Expo mobile app architecture for the School Management ERP. The mobile app is a **companion** to the web dashboard (doc 10) — it provides on-the-go access for Parents, Students, Teachers, and Admins. The agent MUST follow these conventions when generating any React Native code.

### 🎯 Mobile App Scope

The mobile app focuses on **consumption and lightweight actions**. Heavy admin operations (bulk enrollment, fee structure setup, grade management) stay on the web dashboard. The mobile app provides:

| Role        | Primary Features                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------- |
| **PARENT**  | View children's results, invoices, payments, attendance, receive push notifications                |
| **STUDENT** | View own results, exam schedule, payment status, receive push notifications                        |
| **TEACHER** | View assigned classes, enter marks (lightweight), view student lists, receive job-complete alerts  |
| **ADMIN**   | Dashboard overview, approve actions, view reports summaries, receive critical alerts, manage users |

---

### 🛠 Tech Stack

| Layer                  | Technology                                                               |
| ---------------------- | ------------------------------------------------------------------------ |
| **Framework**          | React Native 0.76+ with Expo SDK 52 (Managed Workflow)                   |
| **Language**           | TypeScript (strict mode)                                                 |
| **Navigation**         | Expo Router v4 (file-based routing)                                      |
| **Server State**       | TanStack Query v5 (React Query) — ALL API data fetching                  |
| **Client State**       | Zustand with MMKV persistence (NOT AsyncStorage)                         |
| **Forms**              | React Hook Form + Zod                                                    |
| **Styling**            | NativeWind v4 (Tailwind CSS for React Native)                            |
| **HTTP Client**        | Axios with interceptors (mirrors web client pattern from doc 10)         |
| **Secure Storage**     | expo-secure-store (for JWT tokens)                                       |
| **Push Notifications** | expo-notifications + expo-device (with backend integration via FCM/APNs) |
| **Image/File**         | expo-image-picker + expo-file-system + pre-signed S3 URLs                |
| **Biometrics**         | expo-local-authentication (optional fingerprint/face unlock)             |
| **Icons**              | @expo/vector-icons (Ionicons as primary icon set)                        |
| **Charts**             | react-native-chart-kit (for dashboard summaries)                         |
| **PDF Viewer**         | expo-web-browser or react-native-pdf (for marksheet viewing)             |

---

### 🚨 Strict Mobile Rules

1. **No `useEffect` for data fetching.** ALL API calls MUST go through TanStack Query hooks (`useQuery`, `useMutation`). This is identical to the web rule from doc 10.
2. **No AsyncStorage for tokens.** JWT access tokens and refresh tokens MUST be stored in `expo-secure-store`. Only non-sensitive UI preferences (theme, last viewed tab) may use MMKV.
3. **No inline styles.** Use NativeWind utility classes exclusively. No `StyleSheet.create()` or `style={{}}` objects. Exception: dynamic styles computed at runtime (e.g., progress bar width) may use the `style` prop.
4. **No `any` type.** All API responses, props, navigation params, and state must be fully typed. Define types in `src/types/`.
5. **Components are functional.** No class components. Use named exports only (no default exports).
6. **Currency is NPR.** All money values must display with `रु.` prefix and Nepali number formatting using the shared `formatNPR()` utility.
7. **Offline-first for reads.** TanStack Query `gcTime` and `staleTime` must be configured so previously fetched data is available when offline. Show stale data with a "Last updated" indicator.
8. **No hardcoded API URLs.** Use environment variables via Expo's `app.config.ts` → `extra` field.
9. **Platform-safe code.** Avoid platform-specific imports unless wrapped in `Platform.select()`. Prefer cross-platform Expo SDK APIs.
10. **Keyboard-aware forms.** All form screens MUST use `KeyboardAvoidingView` or a keyboard-aware scroll wrapper. Forms must never be hidden behind the keyboard.

---

### 📁 Folder Structure

```
mobile/
├── app/                              # Expo Router file-based routing
│   ├── _layout.tsx                   # Root layout (providers, fonts, splash)
│   ├── (auth)/                       # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                       # Main tab navigator (authenticated)
│   │   ├── _layout.tsx               # Tab bar layout with role-based tabs
│   │   ├── index.tsx                 # Dashboard / Home
│   │   ├── academics/
│   │   │   ├── _layout.tsx           # Stack navigator for academics
│   │   │   ├── index.tsx             # Exams list / Results overview
│   │   │   └── [examId].tsx          # Exam detail / Marksheet
│   │   ├── finance/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx             # Invoices / Payments list
│   │   │   └── [invoiceId].tsx       # Invoice detail
│   │   ├── students/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx             # Student list (Teacher/Admin)
│   │   │   └── [studentId].tsx       # Student profile
│   │   ├── notifications.tsx         # Notifications list
│   │   └── profile.tsx               # User profile / Settings
│   └── +not-found.tsx                # 404 screen
├── src/
│   ├── api/                          # Axios client + domain API modules
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── students.api.ts
│   │   ├── exams.api.ts
│   │   ├── finance.api.ts
│   │   ├── notifications.api.ts
│   │   └── reports.api.ts
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # Primitives (Button, Input, Card, Badge, etc.)
│   │   ├── forms/                    # Form field wrappers (FormInput, FormSelect, etc.)
│   │   ├── layout/                   # Screen wrapper, SafeArea, KeyboardAware
│   │   └── domain/                   # Domain-specific (StudentCard, InvoiceRow, GradeBadge)
│   ├── hooks/                        # TanStack Query hooks (one file per domain)
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   ├── useExams.ts
│   │   ├── useFinance.ts
│   │   ├── useNotifications.ts
│   │   └── useReports.ts
│   ├── stores/                       # Zustand stores
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   ├── types/                        # TypeScript type definitions
│   │   ├── api.types.ts              # Envelope, pagination, error shapes
│   │   ├── auth.types.ts
│   │   ├── student.types.ts
│   │   ├── exam.types.ts
│   │   ├── finance.types.ts
│   │   └── navigation.types.ts
│   ├── utils/                        # Pure utility functions
│   │   ├── format.ts                 # formatNPR, formatDate, formatNepaliDate
│   │   ├── neb-grades.ts             # NEB grade calculation (mirrors backend)
│   │   ├── storage.ts                # Secure storage helpers (get/set/delete token)
│   │   └── push-notifications.ts     # Push notification registration + handlers
│   └── constants/                    # App-wide constants
│       ├── colors.ts                 # Design tokens
│       ├── config.ts                 # API base URL, pagination defaults, timeouts
│       └── roles.ts                  # Role enum + permission helpers
├── assets/                           # Static assets (fonts, images, splash)
│   ├── fonts/
│   ├── images/
│   └── splash.png
├── app.config.ts                     # Expo config (with environment variables)
├── babel.config.js                   # Babel config (NativeWind preset)
├── nativewind-env.d.ts               # NativeWind TypeScript declarations
├── tailwind.config.ts                # Tailwind config for NativeWind
├── metro.config.js                   # Metro bundler config (NativeWind)
├── tsconfig.json
├── package.json
├── eas.json                          # EAS Build configuration
└── .env.example                      # Environment variable template
```

---

### ⚙️ 1. Expo Configuration

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NEB School ERP",
  slug: "neb-school-erp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "nebschoolerp",
  userInterfaceStyle: "automatic", // Supports light + dark mode
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1E40AF", // School blue
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nebschoolerp.mobile",
    infoPlist: {
      NSFaceIDUsageDescription: "Use Face ID to unlock the app",
      NSCameraUsageDescription: "Take profile photos",
      NSPhotoLibraryUsageDescription: "Upload profile photos",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#1E40AF",
    },
    package: "com.nebschoolerp.mobile",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
    ],
    googleServicesFile: "./google-services.json", // For FCM push notifications
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#1E40AF",
        sounds: ["./assets/sounds/notification.wav"],
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow NEB School ERP to access your photos for profile pictures.",
        cameraPermission:
          "Allow NEB School ERP to use the camera for profile pictures.",
      },
    ],
  ],
  extra: {
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1",
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
});
```

---

### ⚙️ 2. NativeWind Setup

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // Primary blue
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF", // Brand blue (splash, headers)
          900: "#1E3A8A",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: "#6B7280",
        surface: "#F9FAFB",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### ⚙️ 3. Environment Variables

```bash
# .env.example
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
EXPO_PUBLIC_WS_URL=http://localhost:3000
```

**Rule:** Only variables prefixed with `EXPO_PUBLIC_` are accessible in the client bundle. NEVER expose server secrets.

---

### ⚙️ 4. EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://192.168.1.100:3000/api/v1"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://staging-api.school.np/api/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.school.np/api/v1"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./play-store-key.json"
      }
    }
  }
}
```

---

### ⚙️ 5. Package Dependencies

```bash
# Core Expo
npx create-expo-app mobile --template blank-typescript
cd mobile

# Navigation (Expo Router)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Data Fetching & State
npm install @tanstack/react-query axios zustand react-native-mmkv

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Styling
npm install nativewind tailwindcss
npx expo install react-native-reanimated react-native-safe-area-context

# Auth & Security
npx expo install expo-secure-store expo-local-authentication

# Push Notifications
npx expo install expo-notifications expo-device expo-constants

# Media & Files
npx expo install expo-image-picker expo-file-system expo-web-browser

# Icons & Fonts
npx expo install @expo/vector-icons expo-font
npm install @expo-google-fonts/inter

# Charts (Admin dashboard)
npm install react-native-chart-kit react-native-svg

# Misc
npx expo install expo-splash-screen expo-haptics expo-clipboard
npm install date-fns
```

---

### ⚙️ 6. Root Layout (Provider Stack)

```tsx
// app/_layout.tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/stores/auth.store";
import { registerForPushNotifications } from "../src/utils/push-notifications";
import "../global.css";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (offline reads)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
  }, [isAuthenticated]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
```

---

### ⚙️ 7. TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@api/*": ["./src/api/*"],
      "@stores/*": ["./src/stores/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@constants/*": ["./src/constants/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

---

### 📱 8. Platform Support Matrix

| Feature                | iOS | Android | Web (Expo Web)         |
| ---------------------- | --- | ------- | ---------------------- |
| Push Notifications     | ✅  | ✅      | ❌ (use web dashboard) |
| Biometric Auth         | ✅  | ✅      | ❌                     |
| Camera (Profile Photo) | ✅  | ✅      | ✅                     |
| PDF Viewing            | ✅  | ✅      | ✅                     |
| Offline Data Access    | ✅  | ✅      | ✅                     |
| Deep Linking           | ✅  | ✅      | ✅                     |

---

### ⚡ 9. Performance Rules

1. **Use `React.memo` on list item components.** Student cards, invoice rows, and notification items rendered in `FlatList` MUST be memoized.
2. **FlatList over ScrollView.** NEVER render lists with `ScrollView` + `.map()`. Always use `FlatList` or `SectionList` with proper `keyExtractor` and `getItemLayout` when row height is fixed.
3. **Image optimization.** Profile pictures must use cached, resized pre-signed S3 URLs. Use `expo-image` (if available) or set `{ cache: 'force-cache' }` on Image components.
4. **Limit re-renders.** Use Zustand selectors (`useAuthStore(s => s.user)`) to prevent unnecessary re-renders. NEVER subscribe to the entire store.
5. **Lazy load heavy screens.** Report/chart screens should be imported with `React.lazy()` or Expo Router's built-in code splitting.
