import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import type { Loan } from "../../../shared/mobile-api";
import { toDateInputValue } from "../../../shared/dates";
import { useSession } from "../lib/session";
import { Action, ErrorMessage, Field, Hint, money, Screen, Title } from "../components/ui";

export default function LoanPaymentScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind: string }>();
  const { api, data, token, loading, changed } = useSession();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    api<Loan>(`loans/${encodeURIComponent(id)}`).then(value => { if (active) { setLoan(value); setError(""); } }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id, api, retry, token]);
  async function save() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter a positive amount."); return; }
    if (kind === "repayments" && loan && value > loan.balance) { setError("Repayment exceeds the outstanding balance."); return; }
    setBusy(true); setError("");
    try { await api(`loans/${id}/${kind}`, "POST", { amount: value, date, notes }); await changed(); router.back(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (!loading && !token) return <Redirect href="/" />;
  if (!["repayments", "additions"].includes(kind)) return <Screen><ErrorMessage message="Unknown loan action" /></Screen>;
  return <Screen><Title>{kind === "repayments" ? "Record repayment" : "Add loan amount"}</Title><ErrorMessage message={error} />
    {loan ? <><Hint>{loan.personName} · {money(loan.balance, data?.user.currency)} outstanding</Hint><Field label={`Amount (${data?.user.currency ?? ""})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!busy} /><Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} editable={!busy} /><Field label="Notes (optional)" value={notes} onChangeText={setNotes} editable={!busy} /><Action title="Confirm amount" busy={busy} onPress={() => void save()} /></> : <Action title="Retry loading loan" onPress={() => setRetry(value => value + 1)} />}
  </Screen>;
}
