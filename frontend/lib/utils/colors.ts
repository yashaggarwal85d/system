export const colors = {
  background: "#0d0d0d",
  foreground: "#f0f0f0",

  primary: {
    DEFAULT: "#3abff8",
    foreground: "#0d0d0d",
  },
  secondary: {
    DEFAULT: "#0d111a",
    foreground: "#f0f0f0",
  },
  muted: {
    DEFAULT: "#334155",
    foreground: "#94a3b8",
  },
  accent: {
    DEFAULT: "#7dd3fc",
    foreground: "#0d0d0d",
  },
  destructive: {
    DEFAULT: "#ef4444",
    foreground: "#fef2f2",
  },
  success: {
    DEFAULT: "#22c55e",
    foreground: "#f0fdf4",
  },
  warning: {
    DEFAULT: "#eab308",
    foreground: "#fefce8",
  },
  info: {
    DEFAULT: "#38bdf8",
    foreground: "#f0f9ff",
  },
  border: "#1f2937",
  input: "#1e293b",
  ring: "#38bdf8",

  card: {
    DEFAULT: "#111827",
    foreground: "#f0f0f0",
  },
  popover: {
    DEFAULT: "#1f2937",
    foreground: "#f0f0f0",
  },

  swirlBackground: "#0b0a13",
  swirlParticleBaseHue: 200,
  swirlParticleHueRange: 40,
};

import levelThemeOverrides from "./level-themes.json";

export type ColorTheme = typeof colors;

export const defaultTheme: ColorTheme = colors;

export const levelThemes: Record<number, ColorTheme> = {
  1: defaultTheme,
  ...Object.entries(levelThemeOverrides).reduce(
    (acc, [levelStr, overrides]) => {
      const level = parseInt(levelStr, 10);

      const mergedTheme = JSON.parse(JSON.stringify(defaultTheme));
      for (const key in overrides) {
        if (
          typeof overrides[key as keyof typeof overrides] === "object" &&
          overrides[key as keyof typeof overrides] !== null &&
          mergedTheme[key as keyof ColorTheme] &&
          typeof mergedTheme[key as keyof ColorTheme] === "object"
        ) {
          Object.assign(
            mergedTheme[key as keyof ColorTheme] as object,
            overrides[key as keyof typeof overrides]
          );
        } else {
          (mergedTheme as any)[key] = overrides[key as keyof typeof overrides];
        }
      }
      acc[level] = mergedTheme as ColorTheme;
      return acc;
    },
    {} as Record<number, ColorTheme>
  ),
};

export const getThemeForLevel = (level: number): ColorTheme => {
  const availableLevels = Object.keys(levelThemes)
    .map(Number)
    .sort((a, b) => b - a);

  for (const themeLevel of availableLevels) {
    if (level >= themeLevel) {
      return levelThemes[themeLevel];
    }
  }

  return defaultTheme;
};

export const tailwindColors = {
  background: defaultTheme.background,
  foreground: defaultTheme.foreground,
  primary: defaultTheme.primary,
  secondary: defaultTheme.secondary,
  muted: defaultTheme.muted,
  accent: defaultTheme.accent,
  destructive: defaultTheme.destructive,
  success: defaultTheme.success,
  warning: defaultTheme.warning,
  info: defaultTheme.info,
  border: defaultTheme.border,
  input: defaultTheme.input,
  ring: defaultTheme.ring,
  card: defaultTheme.card,
  popover: defaultTheme.popover,
  swirlBackground: defaultTheme.swirlBackground,
};
