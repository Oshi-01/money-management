import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";
import type { Transaction, TransactionInput } from "../../../shared/mobile-api";
import { toDateInputValue } from "../../../shared/dates";
import { parseVoiceCommand } from "../../../shared/voice-commands";
import { voiceCommandSchema } from "../../../shared/voice-schema";
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
            const cats = data?.categories.filter(c => c.type === parsed.type && c.name.toLowerCase() === (parsed.category ?? parsed.title).toLowerCase()) ?? [];
            next = { ...next, description: parsed.title, type: parsed.type as "INCOME" | "EXPENSE", date: parsed.date, categoryId: cats.length === 1 ? cats[0].id : "" };
          }
          next.amount = parsed.amount!;
        }
        if (active) { setDraft(next); setAmount(next.amount > 0 ? String(next.amount) : ""); setLoaded(true); }
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    }
    if (token && data) void load();
    return () => { active = false; };
  }, [id, command, voiceDraft, api, token, data, retry]);
  function field<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) { setDraft(current => ({ ...current, [key]: value })); }
  async function save() {
    const value = Number(amount);
    if (!draft.description.trim() || !draft.categoryId || !Number.isFinite(value) || value <= 0) { setError("Enter a description, a positive amount, and a category."); return; }
    setBusy(true); setError("");
    try { await api(id ? `transactions/${id}` : "transactions", id ? "PUT" : "POST", { ...draft, amount: value }); await changed(); router.back(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (!restoring && !token) return <Redirect href="/" />;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen><Title>{id ? "Edit transaction" : "New transaction"}</Title><ErrorMessage message={error} />
    {loading ? <ActivityIndicator color={colors.primary} /> : !loaded ? <Action title="Retry" onPress={() => setRetry(value => value + 1)} /> : <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 16 }}>
      <Hint>Review all details before confirming. Amounts use {data?.user.currency}.</Hint>
      <Choices label="Type" value={draft.type} options={[{ value: "EXPENSE", label: "Expense" }, { value: "INCOME", label: "Income" }]} onChange={value => { field("type", value as TransactionInput["type"]); field("categoryId", ""); }} />
      <Field label="Description" value={draft.description} onChangeText={value => field("description", value)} maxLength={300} />
      <Field label={`Amount (${data?.user.currency ?? ""})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Choices label="Category" value={draft.categoryId} options={(data?.categories ?? []).filter(c => c.type === draft.type).map(c => ({ value: c.id, label: c.name }))} onChange={value => field("categoryId", value)} />
      <Choices label="Account" value={draft.accountId ?? ""} options={[{ value: "", label: "No linked account" }, ...(data?.accounts ?? []).map(a => ({ value: a.id, label: a.name }))]} onChange={value => field("accountId", value)} />
      <Field label="Date (YYYY-MM-DD)" value={draft.date} onChangeText={value => field("date", value)} autoCapitalize="none" />
      <Field label="Notes (optional)" value={draft.notes} onChangeText={value => field("notes", value)} multiline maxLength={2000} />
      <Action title={id ? "Confirm changes" : "Confirm new transaction"} busy={busy} onPress={() => void save()} />
    </View>}
  </Screen></KeyboardAvoidingView>;
}
