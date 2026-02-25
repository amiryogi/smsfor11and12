import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createMMKV } from "react-native-mmkv";

const mmkv = createMMKV({ id: "ui-store" });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.remove(name);
  },
};

interface UIState {
  colorScheme: "light" | "dark" | "system";
  biometricEnabled: boolean;
  pushEnabled: boolean;
  setColorScheme: (scheme: "light" | "dark" | "system") => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  toggleBiometric: () => void;
  togglePush: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      colorScheme: "system",
      biometricEnabled: false,
      pushEnabled: true,
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      toggleBiometric: () =>
        set((s) => ({ biometricEnabled: !s.biometricEnabled })),
      togglePush: () => set((s) => ({ pushEnabled: !s.pushEnabled })),
    }),
    {
      name: "ui-preferences",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
