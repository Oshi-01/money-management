import { useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform } from "react-native";
import { useSession } from "../lib/session";
import { colors, Action, ErrorMessage, Field, Hint, Screen, Title } from "../components/ui";

export default function LoginScreen() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setBusy(true); setError("");
    try { await session.signIn(email, password); setPassword(""); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (session.loading) return <Screen><ActivityIndicator color={colors.primary} accessibilityLabel="Restoring session" /></Screen>;
  if (session.token) return <Redirect href="/(tabs)" />;
  const website = process.env.EXPO_PUBLIC_API_URL;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen>
    <Title>Monexa</Title><Hint>Sign in with your existing Monexa account.</Hint>
    <ErrorMessage message={error || session.error} />
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!busy} />
    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" editable={!busy} onSubmitEditing={() => void signIn()} />
    <Action title="Sign in" onPress={() => void signIn()} busy={busy} />
    {website && <Action title="Create account or reset password on the website" secondary onPress={() => { void Linking.openURL(`${website.replace(/\/+$/, "")}/login`); }} />}
  </Screen></KeyboardAvoidingView>;
}
