import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSession } from "../../lib/session";
import { Action, ErrorMessage, Screen, Title } from "../../components/ui";
import { colors } from "../../theme/colors";

export default function TabLayout() {
  const session = useSession();
  if (session.loading) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (!session.token) return <Redirect href="/" />;
  if (!session.data) return <Screen><Title>Connect to Monexa</Title><ErrorMessage message={session.error} /><Action title="Retry connection" onPress={() => { void session.refresh().catch(() => {}); }} /><Action title="Sign out" secondary onPress={() => { void session.signOut().catch(() => {}); }} /></Screen>;
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface }, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
    <Tabs.Screen name="index" options={{ title: "Overview" }} /><Tabs.Screen name="transactions" options={{ title: "Transactions" }} /><Tabs.Screen name="loans" options={{ title: "Loans" }} /><Tabs.Screen name="voice" options={{ title: "Voice" }} /><Tabs.Screen name="settings" options={{ title: "Account" }} />
  </Tabs>;
}
