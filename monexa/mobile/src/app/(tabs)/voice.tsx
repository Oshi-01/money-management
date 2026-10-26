import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Alert, AppState, Linking, Text } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { parseVoiceCommand, type VoiceCommand } from "../../../../shared/voice-commands";
import type { Loan, TransactionPage } from "../../../../shared/mobile-api";
import { useSession } from "../../lib/session";
import { Action, Card, Choices, ErrorMessage, Field, Hint, money, Screen, styles, Title } from "../../components/ui";

import { speechLanguages, type VoiceInterpretation } from "../../../../shared/voice-schema";
import { toDateInputValue } from "../../../../shared/dates";

type Match = { id: string; label: string };
const examples = ["গতকাল বাজারে ৫০০ টাকা খরচ করেছি", "Add expense 500 for groceries", "Borrow 2000 from Rahim", "Edit transaction lunch to 250", "Delete loan Rahim"];

export default function VoiceScreen() {
  const { api, data, changed } = useSession();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en-BD");
  const [useAI, setUseAI] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [command, setCommand] = useState<VoiceCommand | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const generation = useRef(0);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    setRequesting(false); setListening(false); setBusy(false);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "background") {
        generation.current++; ExpoSpeechRecognitionModule.abort(); setListening(false); setRequesting(false);
      }
    });
    return () => { subscription.remove(); focused.current = false; generation.current++; ExpoSpeechRecognitionModule.abort(); };
  }, []));
  useSpeechRecognitionEvent("start", () => { if (focused.current) setListening(true); });
  useSpeechRecognitionEvent("end", () => { setListening(false); });
  useSpeechRecognitionEvent("result", event => { if (focused.current) { setText(event.results[0]?.transcript ?? ""); setAlternatives(event.results.slice(1).map(item => item.transcript)); } });
  useSpeechRecognitionEvent("error", event => {
    setListening(false);
    if (focused.current && event.error !== "aborted") setError(event.error === "not-allowed" ? "Microphone or speech permission is blocked. Open microphone settings below and allow access." : `Speech recognition stopped: ${event.message || event.error}. You can type a command instead.`);
  });

  async function speak() {
    setError("");
    const version = ++generation.current;
    setRequesting(true);
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) throw new Error("Speech recognition is unavailable on this phone. You can type a command instead.");
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!focused.current || version !== generation.current) return;
      if (!permission.granted) throw new Error(permission.canAskAgain ? "Allow microphone and speech recognition permission to speak, or type a command." : "Permission is blocked. Open microphone settings below and allow microphone and speech access.");
      setAlternatives([]);
      ExpoSpeechRecognitionModule.start({ lang: language, interimResults: true, continuous: false, maxAlternatives: 3, contextualStrings: [...(data?.categories.map(category => category.name) ?? []), "taka", "expense", "income", "borrow", "lend", "খরচ", "আয়", "ধার"] });
    } catch (err) { if (focused.current && version === generation.current) setError((err as Error).message); }
    finally { if (focused.current) setRequesting(false); }
  }
  function openForm(parsed: VoiceCommand, id?: string) {
    setText(""); setCommand(null); setMatches([]);
    router.push({ pathname: parsed.entity === "transaction" ? "/transaction" : "/loan", params: { ...(id ? { id } : {}), voiceDraft: JSON.stringify(parsed) } });
  }
  async function review() {
    setError("");
    const version = generation.current;
    setBusy(true);
    try {
      const parsed = useAI ? (await api<VoiceInterpretation>("voice/interpret", "POST", { text, today: toDateInputValue() })).command : parseVoiceCommand(text);
      if (!focused.current || version !== generation.current) return;
      if (parsed.action === "create") { openForm(parsed); return; }
      let results: Match[];
      if (parsed.entity === "transaction") {
        const result = await api<TransactionPage>(`transactions?q=${encodeURIComponent(parsed.title)}`);
        if (result.totalCount > 25) throw new Error("More than 25 transactions match. Use a more specific description.");
        results = result.transactions.map(t => ({ id: t.id, label: `${t.description} · ${money(t.amount, data?.user.currency)} · ${t.date.slice(0, 10)} · ${t.category.name}` }));
      } else {
        const result = await api<{ loans: Loan[] }>("loans");
        results = result.loans.filter(l => l.personName.toLowerCase().includes(parsed.title.toLowerCase())).map(l => ({ id: l.id, label: `${l.personName} · ${l.loanType.toLowerCase()} · ${money(l.principalAmount, data?.user.currency)} · ${l.startDate.slice(0, 10)}` }));
      }
      if (!focused.current || version !== generation.current) return;
      if (!results.length) throw new Error("No matching records. Try another description or person’s name.");
      setCommand(parsed); setMatches(results);
    } catch (err) { if (focused.current && version === generation.current) setError((err as Error).message); }
    finally { if (focused.current) setBusy(false); }
  }
  function choose(item: Match) {
    if (!command) return;
    if (command.action === "edit") { openForm(command, item.id); return; }
    const endpoint = command.entity === "loan" ? "loans" : "transactions";
    Alert.alert(`Delete ${command.entity}?`, `${item.label}\n${command.entity === "loan" ? "Repayments and activity history will also be removed." : "The linked account balance will be adjusted."} This cannot be undone.`, [{ text: "Cancel", style: "cancel" }, { text: "Confirm deletion", style: "destructive", onPress: () => {
      setBusy(true); setError("");
      void api(`${endpoint}/${item.id}`, "DELETE").then(async () => {
        setText(""); setCommand(null); setMatches([]); await changed(); Alert.alert("Deleted", "The selected record was deleted.");
      }).catch(err => setError(err.message)).finally(() => setBusy(false));
    } }]);
  }
  return <Screen><Title>Voice assistant</Title><Hint>English and Bangla commands for transactions and loans. Review details before saving. Your phone’s speech service may process audio online.</Hint><ErrorMessage message={error} />
    {command ? <><Card><Text style={styles.label}>{text}</Text><Hint>Select the exact {command.entity} to {command.action}.</Hint></Card>{matches.map(item => <Action key={item.id} title={item.label} secondary disabled={busy} onPress={() => choose(item)} />)}<Action title="Back to command" secondary disabled={busy} onPress={() => { setCommand(null); setMatches([]); setError(""); }} /></> : <>
      {!listening && !requesting && !busy && <><Choices label="Speech language" value={language} options={speechLanguages} onChange={setLanguage} /><Choices label="Understanding" value={useAI ? "ai" : "basic"} options={[{ value: "basic", label: "Basic · no API key" }, { value: "ai", label: "AI · server setup" }]} onChange={value => setUseAI(value === "ai")} /></>}
      <Hint>{useAI ? "Your transcript is sent to the app’s configured AI service. No transaction history is sent." : "Basic mode supports common phrases. AI mode handles more flexible English, Bangla, and mixed phrasing after server setup."}</Hint>
      <Action title={requesting ? "Waiting for permission…" : listening ? "Stop listening" : "Start speaking"} busy={requesting} disabled={busy} onPress={() => { if (listening) ExpoSpeechRecognitionModule.stop(); else void speak(); }} />
      {listening && <Hint>Listening… say one command.</Hint>}
      <Field label="Your command" value={text} onChangeText={setText} multiline editable={!busy && !listening && !requesting} maxLength={500} placeholder="Say a command or type here" />
      {alternatives.map(item => <Action key={item} title={`Alternative: ${item}`} secondary disabled={busy || listening || requesting} onPress={() => { setText(item); setAlternatives([]); }} />)}
      <Action title="Review command" busy={busy} disabled={!text.trim() || listening || requesting} onPress={() => void review()} />
      <Hint>Examples</Hint>{examples.map(example => <Action key={example} title={example} secondary disabled={busy || listening || requesting} onPress={() => setText(example)} />)}
    </>}
    <Action title="Open microphone settings" secondary onPress={() => { void Linking.openSettings().catch(err => setError(err.message)); }} />
  </Screen>;
}
