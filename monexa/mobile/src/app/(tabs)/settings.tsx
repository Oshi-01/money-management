import { useState } from "react";
import { router } from "expo-router";
import { Linking } from "react-native";
import { useSession } from "../../lib/session";
import { Action, Card, ErrorMessage, Hint, Screen, Title } from "../../components/ui";

export default function AccountScreen() {
  const { data, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <Screen><Title>Account</Title><Card><Hint>{data?.user.name}</Hint><Hint>{data?.user.email}</Hint><Hint>Currency: {data?.user.currency}</Hint></Card><ErrorMessage message={error} />
    <Action title="Wallets & cards" secondary onPress={() => router.push("/wallets")} />
    <Action title="Open microphone settings" secondary onPress={() => { void Linking.openSettings().catch(err => setError(err.message)); }} />
    <Action title="Sign out" busy={busy} onPress={() => { setBusy(true); setError(""); void signOut().catch(err => setError(err.message)).finally(() => setBusy(false)); }} />
  </Screen>;
}
