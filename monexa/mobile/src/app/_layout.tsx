import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../lib/session";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { colors } from "../theme/colors";

const navigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider value={navigationTheme}><SessionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerTintColor: colors.primary, headerBackTitle: "Back", headerStyle: { backgroundColor: colors.surface }, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="wallets" options={{ title: "Wallets & cards" }} /><Stack.Screen name="wallet" options={{ title: "Wallet details", presentation: "modal" }} /><Stack.Screen name="category" options={{ title: "Category", presentation: "modal" }} /><Stack.Screen name="transaction" options={{ title: "Review transaction", presentation: "modal" }} /><Stack.Screen name="loan" options={{ title: "Review loan", presentation: "modal" }} /><Stack.Screen name="loan-payment" options={{ title: "Loan payment", presentation: "modal" }} /></Stack></SessionProvider></ThemeProvider></SafeAreaProvider>;
}
