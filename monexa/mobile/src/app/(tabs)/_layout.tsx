import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSession } from "../../lib/session";
import { Action, ErrorMessage, Screen, Title } from "../../components/ui";
import { colors } from "../../theme/colors";

export default function TabLayout() {
  const session = useSession();
  if (session.loading) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (!session.token) return <Redirect href="/" />;
  if (!session.data) return <Screen><Title>Connect to Monexa</Title><ErrorMessage message={session.error} /><Action title="Retry connection" onPress={() => { void session.refresh().catch(() => {}); }} /><Action title="Sign out" secondary onPress={() => { void session.signOut().catch(() => {}); }} /></Screen>;
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarLabelStyle: { fontSize: 10 }, tabBarInactiveTintColor: colors.muted, headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface }, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
    <Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: ({ focused, size }) => <Feather name="pie-chart" color={focused ? colors.primary : colors.muted} size={size} /> }} />
    <Tabs.Screen name="transactions" options={{ title: "Transactions", tabBarIcon: ({ focused, size }) => <Feather name="repeat" color={focused ? colors.primary : colors.muted} size={size} /> }} />
    <Tabs.Screen name="categories" options={{ title: "Categories", tabBarIcon: ({ focused, size }) => <Feather name="tag" color={focused ? colors.primary : colors.muted} size={size} /> }} />
    <Tabs.Screen name="loans" options={{ title: "Loans", tabBarIcon: ({ focused, size }) => <Feather name="file-text" color={focused ? colors.primary : colors.muted} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: "More", tabBarIcon: ({ focused, size }) => <Feather name="grid" color={focused ? colors.primary : colors.muted} size={size} /> }} />
    <Tabs.Screen name="voice" options={{ title: "Voice", href: null }} />
  </Tabs>;
}
