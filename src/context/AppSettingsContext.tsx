"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  wakeLockEnabled: boolean;
  userAge: number;
  userHeightCm: number;
  defaultRestSeconds: number;
}

interface AppSettingsContextType extends AppSettings {
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleWakeLock: () => void;
  setUserAge: (age: number) => void;
  setUserHeightCm: (height: number) => void;
  setDefaultRestSeconds: (sec: number) => void;
}

const STORAGE_KEY = "fuerza_app_user_settings_v1";

const defaultSettings: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  wakeLockEnabled: true,
  userAge: 24,
  userHeightCm: 175,
  defaultRestSeconds: 90,
};

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Cargar configuraciones guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppSettings>;
        setSettings((prev) => ({
          ...prev,
          soundEnabled:
            typeof parsed.soundEnabled === "boolean"
              ? parsed.soundEnabled
              : prev.soundEnabled,
          hapticsEnabled:
            typeof parsed.hapticsEnabled === "boolean"
              ? parsed.hapticsEnabled
              : prev.hapticsEnabled,
          wakeLockEnabled:
            typeof parsed.wakeLockEnabled === "boolean"
              ? parsed.wakeLockEnabled
              : prev.wakeLockEnabled,
          userAge:
            typeof parsed.userAge === "number" && parsed.userAge > 0
              ? parsed.userAge
              : prev.userAge,
          userHeightCm:
            typeof parsed.userHeightCm === "number" && parsed.userHeightCm > 0
              ? parsed.userHeightCm
              : prev.userHeightCm,
          defaultRestSeconds:
            typeof parsed.defaultRestSeconds === "number" &&
            parsed.defaultRestSeconds > 0
              ? parsed.defaultRestSeconds
              : prev.defaultRestSeconds,
        }));
      }
    } catch {
      // Ignorar errores de parseo
    } finally {
      setLoaded(true);
    }
  }, []);

  // Guardar cambios en localStorage
  const save = useCallback((next: AppSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, []);

  const toggleSound = useCallback(() => {
    save({ ...settings, soundEnabled: !settings.soundEnabled });
  }, [settings, save]);

  const toggleHaptics = useCallback(() => {
    save({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
  }, [settings, save]);

  const toggleWakeLock = useCallback(() => {
    save({ ...settings, wakeLockEnabled: !settings.wakeLockEnabled });
  }, [settings, save]);

  const setUserAge = useCallback(
    (age: number) => {
      if (age > 0 && age < 120) {
        save({ ...settings, userAge: Math.round(age) });
      }
    },
    [settings, save],
  );

  const setUserHeightCm = useCallback(
    (height: number) => {
      if (height > 50 && height < 260) {
        save({ ...settings, userHeightCm: Math.round(height) });
      }
    },
    [settings, save],
  );

  const setDefaultRestSeconds = useCallback(
    (sec: number) => {
      if (sec >= 10 && sec <= 180) {
        save({ ...settings, defaultRestSeconds: Math.round(sec) });
      }
    },
    [settings, save],
  );

  return (
    <AppSettingsContext.Provider
      value={{
        ...settings,
        toggleSound,
        toggleHaptics,
        toggleWakeLock,
        setUserAge,
        setUserHeightCm,
        setDefaultRestSeconds,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}
