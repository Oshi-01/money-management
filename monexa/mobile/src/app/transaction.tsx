import { useEffect, useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";
import type { Category, Transaction, TransactionInput } from "../../../shared/mobile-api";
import { toDateInputValue } from "../../../shared/dates";
import { parseVoiceCommand } from "../../../shared/voice-commands";
import { voiceCommandSchema } from "../../../shared/voice-schema";
import { categoryInputSchema } from "../../../shared/categories";
import { useSession } from "../lib/session";
import { colors, Action, Choices, ErrorMessage, Field, Hint, Screen, Title } from "../components/ui";

export default function TransactionScreen() {
  const { id, command, voiceDraft } = useLocalSearchParams<{ id?: string; command?: string; voiceDraft?: string }>();
  const { api, data, token, loading: restoring, changed } = useSession();
  const [draft, setDraft] = useState<TransactionInput>({ description: "", amount: 0, type: "EXPENSE", categoryId: "", accountId: "", date: toDateInputValue(), notes: "" });
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
  const categorySnapshot = useRef<Category[]>([]);
  const ready = Boolean(data);
  useEffect(() => { categorySnapshot.current = data?.categories ?? []; }, [data?.categories]);
  const categories = [...(data?.categories ?? []), ...createdCategories.filter(category => !data?.categories.some(existing => existing.id === category.id))];

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setLoaded(false); setError("");
      try {
        const item = id ? await api<Transaction>(`transactions/${encodeURIComponent(id)}`) : null;
        let next: TransactionInput = item ? { description: item.description, amount: item.amount, type: item.type, categoryId: item.categoryId, accountId: item.accountId ?? "", date: item.date.slice(0, 10), notes: item.notes ?? "" } : { description: "", amount: 0, type: "EXPENSE", categoryId: "", accountId: "", date: toDateInputValue(), notes: "" };
        if (command || voiceDraft) {
          const parsed = voiceDraft ? voiceCommandSchema.parse(JSON.parse(voiceDraft)) : parseVoiceCommand(command!);
          if (parsed.entity !== "transaction" || parsed.action === "delete") throw new Error("This command cannot be used in this form.");
          if (!id) {
            const cats = categorySnapshot.current.filter(c => c.type === parsed.type && c.name.toLowerCase() === (parsed.category ?? parsed.title).toLowerCase());
            next = { ...next, description: parsed.title, type: parsed.type as "INCOME" | "EXPENSE", date: parsed.date, categoryId: cats.length === 1 ? cats[0].id : "" };
          }
          next.amount = parsed.amount!;
        }
        if (active) { setDraft(next); setAmount(next.amount > 0 ? String(next.amount) : ""); setLoaded(true); }
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    }
    if (token && ready) void load();
    return () => { active = false; };
  }, [id, command, voiceDraft, api, token, ready, retry]);
  function field<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) { setDraft(current => ({ ...current, [key]: value })); }
  async function save() {
    if (busy || categoryBusy) return;
    const value = Number(amount);
    if (!draft.description.trim() || !draft.categoryId || !Number.isFinite(value) || value <= 0) { setError("Enter a description, a positive amount, and a category."); return; }
    setBusy(true); setError("");
    try { await api(id ? `transactions/${id}` : "transactions", id ? "PUT" : "POST", { ...draft, amount: value }); await changed(); router.back(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function createInlineCategory() {
    if (busy || categoryBusy) return;
    const parsed = categoryInputSchema.safeParse({ name: categoryName, type: draft.type });
    if (!parsed.success) { setCategoryError(parsed.error.issues[0]?.message ?? "Enter a category name."); return; }
    setCategoryBusy(true); setCategoryError("");
    try {
      const result = await api<{ category: Category }>("categories", "POST", parsed.data);
      setCreatedCategories(current => [...current, result.category]);
      field("categoryId", result.category.id);
      setCategoryName(""); setAddingCategory(false);
      await changed();
    } catch (err) { setCategoryError((err as Error).message); }
    finally { setCategoryBusy(false); }
  }
  if (!restoring && !token) return <Redirect href="/" />;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen><Title>{id ? "Edit transaction" : "New transaction"}</Title><ErrorMessage message={error} />
    {loading ? <ActivityIndicator color={colors.primary} /> : !loaded ? <Action title="Retry" onPress={() => setRetry(value => value + 1)} /> : <View pointerEvents={busy || categoryBusy ? "none" : "auto"} style={{ gap: 16 }}>
      <Hint>Review all details before confirming. Amounts use {data?.user.currency}.</Hint>
      <Choices label="Type" value={draft.type} options={[{ value: "EXPENSE", label: "Expense" }, { value: "INCOME", label: "Income" }]} onChange={value => { if (busy || categoryBusy) return; field("type", value as TransactionInput["type"]); field("categoryId", ""); setCategoryError(""); }} />
      <Field label="Description" value={draft.description} onChangeText={value => field("description", value)} maxLength={300} />
      <Field label={`Amount (${data?.user.currency ?? ""})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Choices label="Category" value={draft.categoryId} options={categories.filter(c => c.type === draft.type).map(c => ({ value: c.id, label: c.name }))} onChange={value => field("categoryId", value)} />
      {addingCategory ? <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: colors.subtle }}>
        <Hint>New {draft.type === "INCOME" ? "income" : "expense"} category</Hint>
        <Field label="New category name" value={categoryName} onChangeText={setCategoryName} maxLength={40} autoFocus editable={!categoryBusy} />
        <ErrorMessage message={categoryError} />
        <Action title="Create and use category" busy={categoryBusy} onPress={() => void createInlineCategory()} />
        <Action title="Cancel category creation" secondary disabled={categoryBusy} onPress={() => { setAddingCategory(false); setCategoryError(""); }} />
      </View> : <Action title="Add a category" secondary disabled={busy} onPress={() => { setAddingCategory(true); setCategoryError(""); }} />}
      <Choices label="Account" value={draft.accountId ?? ""} options={[{ value: "", label: "No linked account" }, ...(data?.accounts ?? []).map(a => ({ value: a.id, label: a.name }))]} onChange={value => field("accountId", value)} />
      <Field label="Date (YYYY-MM-DD)" value={draft.date} onChangeText={value => field("date", value)} autoCapitalize="none" />
      <Field label="Notes (optional)" value={draft.notes} onChangeText={value => field("notes", value)} multiline maxLength={2000} />
      <Action title={id ? "Confirm changes" : "Confirm new transaction"} busy={busy} disabled={categoryBusy} onPress={() => void save()} />
    </View>}
  </Screen></KeyboardAvoidingView>;
}
