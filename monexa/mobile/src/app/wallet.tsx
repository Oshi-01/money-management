import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";
import { isCreditWallet, walletInputAmount, walletInputSchema, walletLast4, walletProvider, walletProviders, type Wallet, type WalletInput } from "../../../shared/wallets";
import { ApiError } from "../lib/api";
import { useSession } from "../lib/session";
import { Action, Choices, colors, ErrorMessage, Field, Hint, Screen, Title } from "../components/ui";

export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { api, token, data, loading: restoring, changed } = useSession();
  const [name, setName] = useState("bKash");
  const [type, setType] = useState<WalletInput["type"]>("BKASH");
  const [last4, setLast4] = useState("");
  const [amount, setAmount] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [previousBalance, setPreviousBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    async function load() {
      setLoading(true); setLoaded(false); setError(""); setConflict(false);
      try {
        const wallet = id ? await api<Wallet>(`accounts/${encodeURIComponent(id)}`) : null;
        if (!active) return;
        setName(wallet?.name ?? "bKash"); setType(wallet ? walletProvider(wallet.type).value : "BKASH"); setLast4(walletLast4(wallet?.prefix ?? null));
        setAmount(wallet ? String(walletInputAmount(wallet)) : ""); setUpdatedAt(wallet?.updatedAt ?? ""); setPreviousBalance(wallet?.balance ?? 0); setLoaded(true);
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [id, api, token, retry]);
  async function save() {
    if (busy || conflict) return;
    if (!amount.trim()) { setError("Enter an amount."); return; }
    const parsed = walletInputSchema.safeParse({ name, type, last4, amount: Number(amount) });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check these details."); return; }
    setBusy(true); setError("");
    try {
      await api<Wallet>(id ? `accounts/${encodeURIComponent(id)}` : "accounts", id ? "PUT" : "POST", { ...parsed.data, ...(id ? { updatedAt, previousBalance } : {}) });
      await changed(); router.back();
    } catch (err) { setError((err as Error).message); setConflict(err instanceof ApiError && err.status === 409); }
    finally { setBusy(false); }
  }
  if (!restoring && !token) return <Redirect href="/" />;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen><Title>{id ? "Update wallet" : "Add wallet or card"}</Title><Hint>This records a balance in Monexa. It does not connect to your provider.</Hint><ErrorMessage message={error} />
    {loading ? <ActivityIndicator color={colors.primary} /> : !loaded ? <Action title="Retry" onPress={() => setRetry(value => value + 1)} /> : <View pointerEvents={busy || conflict ? "none" : "auto"} style={{ gap: 16 }}>
      <Choices label="Provider / card type" value={type} options={walletProviders.map(provider => ({ value: provider.value, label: provider.label }))} onChange={value => { if (busy || conflict) return; if (walletProviders.some(provider => provider.label === name)) setName(walletProvider(value).label); setType(value as WalletInput["type"]); }} />
      <Field label={type.startsWith("VISA") ? "Card name / issuing bank" : "Wallet name"} value={name} onChangeText={setName} maxLength={80} editable={!busy && !conflict} />
      <Field label="Last four digits (optional)" value={last4} onChangeText={value => setLast4(value.replace(/\D/g, ""))} maxLength={4} keyboardType="number-pad" editable={!busy && !conflict} />
      <Hint>Only the last four digits are stored.</Hint>
      <Field label={`${isCreditWallet(type) ? "Amount owed" : "Current balance"} (${data?.user.currency ?? ""})`} value={amount} onChangeText={setAmount} keyboardType="numbers-and-punctuation" editable={!busy && !conflict} />
      {isCreditWallet(type) && <Hint>Enter what you owe. A negative amount means your card has a positive credit balance.</Hint>}
      <Action title={id ? "Save recorded balance" : "Add wallet"} busy={busy} disabled={conflict} onPress={() => void save()} />
    </View>}
    {conflict && <Action title="Discard edits and reload" secondary onPress={() => setRetry(value => value + 1)} />}
  </Screen></KeyboardAvoidingView>;
}
