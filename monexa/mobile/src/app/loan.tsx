import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Text, View } from "react-native";
import type { Loan, LoanInput } from "../../../shared/mobile-api";
import { toDateInputValue } from "../../../shared/dates";
import { parseVoiceCommand } from "../../../shared/voice-commands";
import { voiceCommandSchema } from "../../../shared/voice-schema";
import { useSession } from "../lib/session";
import { Action, Card, Choices, colors, ErrorMessage, Field, Hint, money, Screen, styles, Title } from "../components/ui";

const emptyLoan = (): LoanInput => ({ personName: "", principalAmount: 0, loanType: "BORROWED", startDate: toDateInputValue(), dueDate: "", notes: "", includeInTotal: true });
export default function LoanScreen() {
  const { id, command, voiceDraft } = useLocalSearchParams<{ id?: string; command?: string; voiceDraft?: string }>();
  const { api, data, token, loading: restoring, changed } = useSession();
  const [draft, setDraft] = useState<LoanInput>(emptyLoan);
  const [existing, setExisting] = useState<Loan | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setLoaded(false); setError("");
      try {
        const item = id ? await api<Loan>(`loans/${encodeURIComponent(id)}`) : null;
        let next: LoanInput = item ? { personName: item.personName, principalAmount: item.principalAmount, loanType: item.loanType, startDate: item.startDate.slice(0, 10), dueDate: item.dueDate?.slice(0, 10) ?? "", notes: item.notes ?? "", includeInTotal: item.includeInTotal } : emptyLoan();
        if (command || voiceDraft) {
          const parsed = voiceDraft ? voiceCommandSchema.parse(JSON.parse(voiceDraft)) : parseVoiceCommand(command!);
          if (parsed.entity !== "loan" || parsed.action === "delete") throw new Error("This command cannot be used in this form.");
          if (!id) next = { ...next, personName: parsed.title, loanType: parsed.type as LoanInput["loanType"], startDate: parsed.date };
          next.principalAmount = parsed.amount!;
        }
        if (active) { setDraft(next); setExisting(item); setAmount(next.principalAmount > 0 ? String(next.principalAmount) : ""); setLoaded(true); }
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    }
    if (token) void load();
    return () => { active = false; };
  }, [id, command, voiceDraft, api, token, retry]);
  function field<K extends keyof LoanInput>(key: K, value: LoanInput[K]) { setDraft(current => ({ ...current, [key]: value })); }
  async function save() {
    const value = Number(amount);
    if (!draft.personName.trim() || !Number.isFinite(value) || value <= 0) { setError("Enter a person’s name and a positive principal amount."); return; }
    setBusy(true); setError("");
    try { await api(id ? `loans/${id}` : "loans", id ? "PUT" : "POST", { ...draft, principalAmount: value }); await changed(); router.back(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (!restoring && !token) return <Redirect href="/" />;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen><Title>{id ? "Edit loan" : "Record loan"}</Title><ErrorMessage message={error} />
    {loading ? <ActivityIndicator color={colors.primary} /> : !loaded ? <Action title="Retry" onPress={() => setRetry(value => value + 1)} /> : <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 16 }}>
      <Choices label="Loan type" value={draft.loanType} options={[{ value: "BORROWED", label: "Borrowed" }, { value: "LENT", label: "Lent" }]} onChange={value => field("loanType", value as LoanInput["loanType"])} />
      <Field label="Person’s name" value={draft.personName} onChangeText={value => field("personName", value)} maxLength={200} />
      <Field label={`Principal (${data?.user.currency ?? ""})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      {existing && <Hint>Outstanding: {money(existing.balance, data?.user.currency)}. Editing the principal adjusts the outstanding balance; repayments are retained.</Hint>}
      <Field label="Start date (YYYY-MM-DD)" value={draft.startDate} onChangeText={value => field("startDate", value)} autoCapitalize="none" />
      <Field label="Due date (optional, YYYY-MM-DD)" value={draft.dueDate} onChangeText={value => field("dueDate", value)} autoCapitalize="none" />
      <Field label="Notes (optional)" value={draft.notes} onChangeText={value => field("notes", value)} multiline maxLength={2000} />
      <View style={styles.row}><Switch accessibilityLabel="Include loan in totals" trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} ios_backgroundColor={colors.border} value={draft.includeInTotal} onValueChange={value => field("includeInTotal", value)} /><Text style={styles.label}>Include in totals</Text></View>
      <Action title={id ? "Confirm changes" : "Confirm new loan"} busy={busy} onPress={() => void save()} />
      {existing && <><Title>Repayments</Title>{existing.repayments.length ? existing.repayments.map(p => <Card key={p.id}><Text style={styles.label}>{money(p.amount, data?.user.currency)} · {p.paymentDate.slice(0, 10)}</Text>{p.notes && <Hint>{p.notes}</Hint>}</Card>) : <Hint>No repayments yet.</Hint>}</>}
    </View>}
  </Screen></KeyboardAvoidingView>;
}
