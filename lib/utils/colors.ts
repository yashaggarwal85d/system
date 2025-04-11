export const colors = {
  background: "#0d0d0d",
  foreground: "#f0f0f0",

  primary: {
    DEFAULT: "#3abff8",
    foreground: "#0d0d0d",
  },
  secondary: {
    DEFAULT: "#1e293b",
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

export const tailwindColors = {
  background: colors.background,
  foreground: colors.foreground,
  primary: colors.primary,
  secondary: colors.secondary,
  muted: colors.muted,
  accent: colors.accent,
  destructive: colors.destructive,
  success: colors.success,
  warning: colors.warning,
  info: colors.info,
  border: colors.border,
  input: colors.input,
  ring: colors.ring,
  card: colors.card,
  popover: colors.popover,
  swirlBackground: colors.swirlBackground,
};

export type ColorTheme = typeof colors;
