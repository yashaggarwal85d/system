export const colors = {
  background: "#0d0d0d",
  foreground: "#f0f0f0",

  primary: {
    DEFAULT: "#3abff8", // Light Blue (Default)
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
    DEFAULT: "#7dd3fc", // Lighter Blue (Default)
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
  ring: "#38bdf8", // Light Blue (Default)

  card: {
    DEFAULT: "#111827",
    foreground: "#f0f0f0",
  },
  popover: {
    DEFAULT: "#1f2937",
    foreground: "#f0f0f0",
  },

  swirlBackground: "#0b0a13",
  swirlParticleBaseHue: 200, // Blueish (Default)
  swirlParticleHueRange: 40,
};

import levelThemeOverrides from "./level-themes.json"; // Import the JSON data

export type ColorTheme = typeof colors;

export const defaultTheme: ColorTheme = colors;

// --- Theme Mapping & Retrieval ---

// Build the levelThemes object by merging overrides with the default theme
export const levelThemes: Record<number, ColorTheme> = {
  1: defaultTheme, // Level 1 always uses the default theme
  ...Object.entries(levelThemeOverrides).reduce(
    (acc, [levelStr, overrides]) => {
      const level = parseInt(levelStr, 10);
      // Deep merge overrides onto a copy of the default theme
      // Note: This is a simple merge; more complex merging might be needed
      // if nested structures beyond one level need selective overriding.
      const mergedTheme = JSON.parse(JSON.stringify(defaultTheme)); // Deep copy
      for (const key in overrides) {
        if (
          typeof overrides[key as keyof typeof overrides] === "object" &&
          overrides[key as keyof typeof overrides] !== null &&
          mergedTheme[key as keyof ColorTheme] &&
          typeof mergedTheme[key as keyof ColorTheme] === "object"
        ) {
          // Merge nested objects like 'primary', 'accent'
          Object.assign(
            mergedTheme[key as keyof ColorTheme] as object,
            overrides[key as keyof typeof overrides]
          );
        } else {
          // Assign top-level properties like 'ring', 'swirlParticleBaseHue'
          (mergedTheme as any)[key] = overrides[key as keyof typeof overrides];
        }
      }
      acc[level] = mergedTheme as ColorTheme;
      return acc;
    },
    {} as Record<number, ColorTheme>
  ),
};

// Function to get the appropriate theme based on player level
// (This function remains the same)
export const getThemeForLevel = (level: number): ColorTheme => {
  const availableLevels = Object.keys(levelThemes)
    .map(Number)
    .sort((a, b) => b - a); // Sort levels descending [15, 10, 5, 1]

  for (const themeLevel of availableLevels) {
    if (level >= themeLevel) {
      return levelThemes[themeLevel];
    }
  }
  // Should ideally not be reached if level 1 theme exists
  return defaultTheme;
};

// --- Tailwind Configuration ---
// Tailwind config now uses the default theme initially.
// The actual theme applied to the UI will be managed dynamically.
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
