export const colors = {
  background: "#f5f2eb",
  foreground: "#1c1c1c",

  primary: {
    DEFAULT: "#735f32",
    foreground: "#fffaf3",
  },
  secondary: {
    DEFAULT: "#c2bba7",
    foreground: "#1c1c1c",
  },
  muted: {
    DEFAULT: "#d6d2c6",
    foreground: "#2a2a2a",
  },
  accent: {
    DEFAULT: "#a37c2c",
    foreground: "#fdfbf7",
  },
  destructive: {
    DEFAULT: "#b04a4a",
    foreground: "#fff1f1",
  },
  success: {
    DEFAULT: "#6f9e58",
    foreground: "#f3fff5",
  },
  warning: {
    DEFAULT: "#cc8b2f",
    foreground: "#fff9f2",
  },
  info: {
    DEFAULT: "#6489af",
    foreground: "#f2faff",
  },

  input: "#ddd9cf",
  border: "#9c9480",
  ring: "#a37c2c",

  card: {
    DEFAULT: "#f2efe6",
    foreground: "#1c1c1c",
  },
  popover: {
    DEFAULT: "#e8e4dc",
    foreground: "#1c1c1c",
  },

  swirlBackground: "#f5f2eb",
  swirlParticleBaseHue: 40,
  swirlParticleHueRange: 20,
};

export const darkColors = {
  background: "#0f0e0d",
  foreground: "#f3f0e7",

  primary: {
    DEFAULT: "#735f32",
    foreground: "#fdfaf3",
  },
  secondary: {
    DEFAULT: "#2a2927",
    foreground: "#e5e1d9",
  },
  muted: {
    DEFAULT: "#3d3b39",
    foreground: "#b4b0a5",
  },
  accent: {
    DEFAULT: "#fdfaf3",
    foreground: "#1a1a1a",
  },
  destructive: {
    DEFAULT: "#cc5a5a",
    foreground: "#fef2f2",
  },
  success: {
    DEFAULT: "#77b779",
    foreground: "#f0fdf4",
  },
  warning: {
    DEFAULT: "#d6a44c",
    foreground: "#fff8e5",
  },
  info: {
    DEFAULT: "#7da9c7",
    foreground: "#f0faff",
  },

  border: "#2d2c2a",
  input: "#1a1a1a",
  ring: "#fdfaf3",

  card: {
    DEFAULT: "#1a1a1a",
    foreground: "#f3f0e7",
  },
  popover: {
    DEFAULT: "#232220",
    foreground: "#f3f0e7",
  },

  swirlBackground: "#0f0e0d",
  swirlParticleBaseHue: 40,
  swirlParticleHueRange: 30,
};

export type ColorTheme = typeof colors;
export const defaultTheme: ColorTheme = colors;

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
};
