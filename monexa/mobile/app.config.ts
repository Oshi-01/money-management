import type { ConfigContext, ExpoConfig } from "expo/config";
import palette from "../shared/colors.json";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Monexa",
  slug: config.slug ?? "monexa",
  userInterfaceStyle: "light",
  backgroundColor: palette.background,
  primaryColor: palette.primary,
  android: {
    ...config.android,
    adaptiveIcon: { ...config.android?.adaptiveIcon, backgroundColor: palette.primary },
  },
});
