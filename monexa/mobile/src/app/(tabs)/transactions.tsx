import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Transaction, TransactionPage } from "../../../../shared/mobile-api";
import { useSession } from "../../lib/session";
import { Action, Card, colors, ErrorMessage, Field, Hint, money, styles, Title } from "../../components/ui";

export default function TransactionsScreen() {
  const { api, data, revision, changed } = useSession();
  const [result, setResult] = useState<TransactionPage | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(""); setResult(null);
    api<TransactionPage>(`transactions?page=${page}&q=${encodeURIComponent(search)}`)
      .then(value => { if (active) setResult(value); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // The counters intentionally refetch after a mutation or an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, page, search, revision, retry]));
  function remove(item: Transaction) {
    Alert.alert("Delete transaction?", `${item.description} · ${money(item.amount, data?.user.currency)}. This adjusts the linked account balance and cannot be undone.`, [
      { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => {
        setBusy(true); setError("");
        void api(`transactions/${item.id}`, "DELETE").then(async () => { setPage(1); await changed(); })
          .catch(err => setError(err.message)).finally(() => setBusy(false));
      } },
    ]);
  }
  return <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}><FlatList
    data={result?.transactions ?? []} keyExtractor={item => item.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 12 }}><Title>Transactions</Title><Action title="Add transaction" disabled={busy} onPress={() => router.push("/transaction")} /><Field label="Search transactions" value={input} onChangeText={setInput} returnKeyType="search" onSubmitEditing={() => { setPage(1); setSearch(input.trim()); }} /><Action title="Search" secondary onPress={() => { setPage(1); setSearch(input.trim()); setRetry(value => value + 1); }} /><ErrorMessage message={error} />{loading && <ActivityIndicator color={colors.primary} />}{error && <Action title="Retry" secondary onPress={() => setRetry(value => value + 1)} />}</View>}
    ListEmptyComponent={!loading && !error ? <Hint>No transactions match. Add your first transaction above.</Hint> : undefined}
    renderItem={({ item }) => <Card><Text style={styles.label}>{item.description}</Text><Hint>{item.type === "INCOME" ? "Income" : "Expense"} · {item.category.name} · {item.date.slice(0, 10)}</Hint><Text style={[styles.label, { color: item.type === "INCOME" ? colors.income : colors.expense }]}>{item.type === "INCOME" ? "+" : "−"}{money(item.amount, data?.user.currency)}</Text><View style={styles.row}><Action title="Edit" secondary disabled={busy} onPress={() => router.push({ pathname: "/transaction", params: { id: item.id } })} /><Action title="Delete" danger busy={busy} onPress={() => remove(item)} /></View></Card>}
    ListFooterComponent={result && result.totalCount > 25 ? <View style={{ gap: 8 }}><Hint>Page {page} · {result.totalCount} transactions</Hint><Action title="Previous page" secondary disabled={loading || page <= 1} onPress={() => setPage(value => value - 1)} /><Action title="Next page" secondary disabled={loading || page * result.pageSize >= result.totalCount} onPress={() => setPage(value => value + 1)} /></View> : undefined}
  /></SafeAreaView>;
}
