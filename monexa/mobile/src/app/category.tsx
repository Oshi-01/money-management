import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { categoryInputSchema, type ManagedCategory } from "../../../shared/categories";
import { useSession } from "../lib/session";
import { Action, Card, Choices, colors, ErrorMessage, Field, Hint, Screen, styles } from "../components/ui";

export default function CategoryScreen() {
  const { id, type: initialType, mode } = useLocalSearchParams<{ id?: string; type?: string; mode?: string }>();
  const { api, token, data, loading: restoring, changed } = useSession();
  const [category, setCategory] = useState<ManagedCategory | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType === "INCOME" ? "INCOME" : "EXPENSE");
  const [moveToId, setMoveToId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const deleting = mode === "delete" && !!id;
  useEffect(() => {
    if (!token) return;
    let active = true;
    async function load() {
      setLoading(true); setLoaded(false); setError("");
      try {
        const result = id ? await api<ManagedCategory>(`categories/${encodeURIComponent(id)}`) : null;
        if (!active) return;
        setCategory(result); setName(result?.name ?? ""); setType(result?.type ?? (initialType === "INCOME" ? "INCOME" : "EXPENSE")); setMoveToId(""); setLoaded(true);
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [api, token, id, initialType, retry]);
  const hasData = !!category && category.transactions + category.budgets > 0;
  const replacements = (data?.categories ?? []).filter(item => item.id !== id && item.type === category?.type);
  const replacement = replacements.find(item => item.id === moveToId);
  async function save() {
    if (busy || category?.isSystem) return;
    const parsed = categoryInputSchema.safeParse({ name, type });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check these details."); return; }
    setBusy(true); setError("");
    try { await api(id ? `categories/${encodeURIComponent(id)}` : "categories", id ? "PUT" : "POST", parsed.data); await changed(); router.back(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  function remove() {
    if (!id || !category || busy || category.isSystem || (hasData && !replacement)) return;
    Alert.alert(`Delete ${category.name}?`, hasData ? `Move ${category.transactions} transactions and ${category.budgets} budgets to ${replacement!.name}. Transaction amounts and wallet balances stay unchanged.` : "This unused category will be deleted.", [
      { text: "Cancel", style: "cancel" }, { text: "Delete category", style: "destructive", onPress: () => {
        setBusy(true); setError("");
        void api(`categories/${encodeURIComponent(id)}${hasData ? `?moveToId=${encodeURIComponent(moveToId)}` : ""}`, "DELETE").then(async () => { await changed(); router.back(); }).catch(err => setError(err.message)).finally(() => setBusy(false));
      } },
    ]);
  }
  if (!restoring && !token) return <Redirect href="/" />;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Stack.Screen options={{ title: deleting ? "Delete category" : id ? "Edit category" : "New category" }} /><Screen>
    <ErrorMessage message={error} />
    {loading ? <ActivityIndicator color={colors.primary} /> : !loaded ? <Action title="Retry loading category" onPress={() => setRetry(value => value + 1)} /> : category?.isSystem ? <Card><Text selectable style={styles.label}>{category.name}</Text><Hint>This built-in category can be used in transactions but cannot be edited or deleted.</Hint></Card> : deleting ? <>
      <Card><Text selectable style={styles.label}>{category?.name}</Text><Hint>{category?.transactions ?? 0} transactions · {category?.budgets ?? 0} budgets</Hint></Card>
      {hasData ? <><Hint>Choose another {category?.type === "INCOME" ? "income" : "expense"} category for these items. Matching monthly budgets will be merged.</Hint><View pointerEvents={busy ? "none" : "auto"}><Choices label="Move existing items to" value={moveToId} options={replacements.map(item => ({ value: item.id, label: item.name }))} onChange={setMoveToId} /></View>{replacements.length === 0 && <Hint>Create another category of the same type before deleting this one.</Hint>}</> : <Hint>This category is unused. Deleting it will not remove any transactions.</Hint>}
      <Action title="Delete category" danger busy={busy} disabled={hasData && !replacement} onPress={remove} />
      {error && <Action title="Refresh category usage" secondary disabled={busy} onPress={() => setRetry(value => value + 1)} />}
    </> : <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 16 }}>
      <Field label="Category name" value={name} onChangeText={setName} placeholder="e.g. Groceries or Freelance work" maxLength={40} autoFocus editable={!busy} />
      {hasData ? <Card><Text style={styles.label}>Type: {type === "INCOME" ? "Income" : "Expense"}</Text><Hint>Transactions or budgets use this category. Create a new category to use a different type.</Hint></Card> : <Choices label="Type" value={type} options={[{ value: "EXPENSE", label: "Expense" }, { value: "INCOME", label: "Income" }]} onChange={value => { if (!busy) setType(value as "INCOME" | "EXPENSE"); }} />}
      <Action title={id ? "Save changes" : "Create category"} busy={busy} onPress={() => void save()} />
    </View>}
  </Screen></KeyboardAvoidingView>;
}
