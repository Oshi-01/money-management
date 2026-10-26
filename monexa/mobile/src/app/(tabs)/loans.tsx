import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Loan } from "../../../../shared/mobile-api";
import { useSession } from "../../lib/session";
import { Action, Card, colors, ErrorMessage, Hint, money, styles, Title } from "../../components/ui";

export default function LoansScreen() {
  const { api, data, revision, changed } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError("");
    api<{ loans: Loan[] }>("loans").then(value => { if (active) setLoans(value.loans); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // The counters intentionally refetch after a mutation or an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, revision, retry]));
  function remove(loan: Loan) {
    Alert.alert("Delete loan?", `${loan.personName} · ${money(loan.principalAmount, data?.user.currency)}. The loan, repayments, and activity history will be permanently deleted.`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => {
      setBusy(true); setError("");
      void api(`loans/${loan.id}`, "DELETE").then(() => changed()).catch(err => setError(err.message)).finally(() => setBusy(false));
    } }]);
  }
  return <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}><FlatList data={loans} keyExtractor={item => item.id} contentContainerStyle={styles.content}
    ListHeaderComponent={<View style={{ gap: 12 }}><Title>Loans</Title><Action title="Record loan" disabled={busy} onPress={() => router.push("/loan")} /><ErrorMessage message={error} />{loading && <ActivityIndicator color={colors.primary} />}<Action title="Refresh loans" secondary disabled={loading} onPress={() => setRetry(value => value + 1)} /></View>}
    ListEmptyComponent={!loading && !error ? <Hint>No loans yet.</Hint> : undefined}
    renderItem={({ item }) => <Card><Text style={styles.label}>{item.personName}</Text><Hint>{item.loanType === "BORROWED" ? "Borrowed from" : "Lent to"} · {item.status.toLowerCase()}</Hint><Text style={[styles.label, { color: item.loanType === "BORROWED" ? colors.expense : colors.income }]}>{money(item.balance, data?.user.currency)} outstanding</Text><Hint>Principal {money(item.principalAmount, data?.user.currency)} · Since {item.startDate.slice(0, 10)}{item.dueDate ? ` · Due ${item.dueDate.slice(0, 10)}` : ""}</Hint>
      <View style={styles.row}><Action title="Edit / history" secondary disabled={busy} onPress={() => router.push({ pathname: "/loan", params: { id: item.id } })} /><Action title="Delete" danger busy={busy} onPress={() => remove(item)} /></View>
      <View style={styles.row}><Action title="Record repayment" secondary disabled={busy || item.balance <= 0} onPress={() => router.push({ pathname: "/loan-payment", params: { id: item.id, kind: "repayments" } })} /><Action title="Add amount" secondary disabled={busy} onPress={() => router.push({ pathname: "/loan-payment", params: { id: item.id, kind: "additions" } })} /></View>
    </Card>}
  /></SafeAreaView>;
}
