// lib/utils/colors.ts

// Object containing all theme values, including non-color config
export const colors = {
  // Core palette based on globals.css HSL values
  background: "#1a1a1a", // ~ hsl(220 25% 4%)
  foreground: "#f5f5f5", // ~ hsl(198 95% 95%)

  primary: {
    // Corresponds to original --primary, --accent, --ring
    DEFAULT: "#4adef6", // ~ hsl(198 95% 65%) - Using a hex closer to the HSL
    foreground: "#1a1a1a", // ~ hsl(220 25% 4%) - Matches original --primary-foreground
  },
  secondary: {
    // Corresponds to original --secondary, --muted, --border, --input
    DEFAULT: "#21262d", // ~ hsl(220 25% 8%) - Using a hex closer to the HSL
    foreground: "#f5f5f5", // ~ hsl(198 95% 95%) - Matches original --secondary-foreground
  },
  muted: {
    // Explicitly defined based on original --muted
    DEFAULT: "#21262d", // ~ hsl(220 25% 8%)
    foreground: "#4adef6", // ~ hsl(198 95% 65%) - Matches original --muted-foreground
  },
  accent: {
    // Explicitly defined based on original --accent
    DEFAULT: "#4adef6", // ~ hsl(198 95% 65%)
    foreground: "#1a1a1a", // ~ hsl(220 25% 4%)
  },
  destructive: {
    DEFAULT: "#f87171", // ~ hsl(0 84.2% 60.2%) - Using a hex closer to the HSL
    foreground: "#f8fafc", // ~ hsl(210 40% 98%) - Using a hex closer to the HSL
  },
  success: {
    // Added for success messages (e.g., green-500)
    DEFAULT: "#22c55e",
    foreground: "#f5f5f5",
  },
  warning: {
    // Added for warning messages (e.g., yellow-500)
    DEFAULT: "#eab308",
    foreground: "#1a1a1a",
  },
  info: {
    // Added for informational messages (e.g., orange-500)
    DEFAULT: "#f97316",
    foreground: "#f5f5f5",
  },
  border: "#21262d", // ~ hsl(220 25% 8%)
  input: "#21262d", // ~ hsl(220 25% 8%)
  ring: "#4adef6", // ~ hsl(198 95% 65%)

  // Shadcn UI specific names - mapping to the core palette
  card: {
    DEFAULT: "#1a1a1a", // Uses background
    foreground: "#f5f5f5", // Uses foreground
  },
  popover: {
    DEFAULT: "#1a1a1a", // Uses background
    foreground: "#f5f5f5", // Uses foreground
  },

  // Swirl effect specific colors/values
  swirlBackground: "#100d1a", // ~ hsla(260, 40%, 5%, 1)
  swirlParticleBaseHue: 120,
  swirlParticleHueRange: 50,
};

// Separate object specifically for Tailwind config, containing only color strings
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
  swirlBackground: colors.swirlBackground, // Include swirl background color
  // Exclude swirlParticleBaseHue and swirlParticleHueRange as they are numbers
};

export type ColorTheme = typeof colors;
