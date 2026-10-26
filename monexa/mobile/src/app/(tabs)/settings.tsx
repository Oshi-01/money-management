import { useState } from "react";
import { router } from "expo-router";
import { Linking } from "react-native";
import { useSession } from "../../lib/session";
import { Action, Card, ErrorMessage, Hint, Screen } from "../../components/ui";

export default function AccountScreen() {
  const { data, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <Screen><Card><Hint>{data?.user.name}</Hint><Hint>{data?.user.email}</Hint><Hint>Currency: {data?.user.currency}</Hint></Card><ErrorMessage message={error} />
    <Action title="Categories" secondary onPress={() => router.push("/(tabs)/categories")} />
    <Action title="Voice assistant" secondary onPress={() => router.push("/(tabs)/voice")} />
    <Action title="Wallets & cards" secondary onPress={() => router.push("/wallets")} />
    <Action title="Open microphone settings" secondary onPress={() => { void Linking.openSettings().catch(err => setError(err.message)); }} />
    <Action title="Sign out" busy={busy} onPress={() => { setBusy(true); setError(""); void signOut().catch(err => setError(err.message)).finally(() => setBusy(false)); }} />
  </Screen>;
}
