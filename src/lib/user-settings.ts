export type UserSettings = {
  defaultRiskPercent: number;
  defaultEmotion: "calm" | "confidence" | "fear" | "greed" | "frustration";
  preferredCurrency: string;
  timezone: string;
  compactTables: boolean;
};

export const USER_SETTINGS_KEY = "atjp.settings.v1";

export const defaultUserSettings: UserSettings = {
  defaultRiskPercent: 1,
  defaultEmotion: "calm",
  preferredCurrency: "USD",
  timezone: "UTC",
  compactTables: false,
};

export function loadUserSettings(): UserSettings {
  if (typeof window === "undefined") return defaultUserSettings;

  const raw = window.localStorage.getItem(USER_SETTINGS_KEY);
  if (!raw) return defaultUserSettings;

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...defaultUserSettings, ...parsed };
  } catch {
    return defaultUserSettings;
  }
}

export function saveUserSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
}