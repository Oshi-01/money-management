import palette from "../../../shared/colors.json";

// Fixed light colors shared with the website; never derived from system appearance.
export const colors = {
  ...palette,
  text: palette.foreground,
  muted: palette.mutedForeground,
} as const;
