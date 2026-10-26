import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import type { ManagedCategory } from "../../../../shared/categories";
import { useSession } from "../../lib/session";
import { Action, Card, Choices, colors, ErrorMessage, Field, Hint, styles } from "../../components/ui";

export default function CategoriesScreen() {
  const { api, token } = useSession();
  const [categories, setCategories] = useState<ManagedCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!token) return;
    const version = ++generation.current;
    setLoading(true); setError("");
    try {
      const result = await api<{ categories: ManagedCategory[] }>("categories");
      if (version === generation.current) setCategories(result.categories);
    } catch (err) { if (version === generation.current) setError((err as Error).message); }
    finally { if (version === generation.current) setLoading(false); }
  }, [api, token]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  const filtered = (categories ?? []).filter(category => (type === "ALL" || type === category.type) && category.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}><FlatList
    data={filtered} keyExtractor={item => item.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    refreshing={loading && categories !== null} onRefresh={() => { void load(); }}
    ListHeaderComponent={<View style={{ gap: 14 }}>
      <Hint>Organize the money coming in and going out.</Hint>
      <Action title="Add category" onPress={() => router.push({ pathname: "/category", params: { type: type === "INCOME" ? "INCOME" : "EXPENSE" } })} />
      <Field label="Search categories" placeholder="Find a category" value={search} onChangeText={setSearch} maxLength={40} />
      <Choices label="Show categories" value={type} onChange={setType} options={[{ value: "ALL", label: "All" }, { value: "EXPENSE", label: "Expenses" }, { value: "INCOME", label: "Income" }]} />
      <ErrorMessage message={error} />{error && <Action title="Retry loading categories" secondary onPress={() => { void load(); }} />}
      {loading && categories === null && <ActivityIndicator color={colors.primary} />}
    </View>}
    ListEmptyComponent={!loading && !error && categories !== null ? <Card><Text style={styles.label}>{search || type !== "ALL" ? "No matching categories" : "No categories yet"}</Text><Hint>{search || type !== "ALL" ? "Try a different search or show all types." : "Add a category to organize your first transaction."}</Hint></Card> : undefined}
    renderItem={({ item }) => <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: item.type === "INCOME" ? colors.incomeSoft : colors.expenseSoft }}><Feather name={item.type === "INCOME" ? "arrow-down-left" : "arrow-up-right"} size={18} color={item.type === "INCOME" ? colors.income : colors.expense} /></View>
        <View style={{ flex: 1, minWidth: 0 }}><Text selectable style={styles.label}>{item.name}</Text><Hint>{item.type === "INCOME" ? "Income" : "Expense"}{item.isSystem ? " · Built-in" : ""}</Hint></View>
      </View>
      <Hint>{item.transactions} {item.transactions === 1 ? "transaction" : "transactions"} · {item.budgets} {item.budgets === 1 ? "budget" : "budgets"}</Hint>
      {!item.isSystem && <View style={styles.row}><Action title="Edit" accessibilityLabel={`Edit ${item.name}`} secondary onPress={() => router.push({ pathname: "/category", params: { id: item.id } })} /><Action title="Delete" accessibilityLabel={`Delete ${item.name}`} danger onPress={() => router.push({ pathname: "/category", params: { id: item.id, mode: "delete" } })} /></View>}
    </Card>}
  /></SafeAreaView>;
}
