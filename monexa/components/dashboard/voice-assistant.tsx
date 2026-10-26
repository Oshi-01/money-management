"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mic, Square, Loader2, ArrowLeft, Check, Pencil, Volume2, VolumeX, ArrowUp, ArrowDownLeft, ArrowUpRight, Landmark, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getUserSettings } from "@/app/actions/settings";
import { createTransaction, updateTransaction, deleteTransaction, getTransactions } from "@/app/actions/transactions";
import { createLoan, updateLoan, deleteLoan, getLoans } from "@/app/actions/loans";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice-commands";
import { formatCurrency } from "@/lib/utils";
import { understandVoice } from "@/app/actions/voice";
import { speechLanguages } from "@/shared/voice-schema";
import { toDateInputValue } from "@/shared/dates";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
type Draft = {
  id?: string;
  title: string;
  amount: string;
  type: string;
  date: string;
  categoryId: string;
  accountId: string;
  notes: string;
  dueDate: string;
  includeInTotal: boolean;
};
type Option = { draft: Draft; label: string };
type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Account = Awaited<ReturnType<typeof getUserAccounts>>[number];
const selectClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const typeLabels: Record<string, string> = { INCOME: "Income", EXPENSE: "Expense", BORROWED: "Borrowed", LENT: "Lent" };

function stopRecognition(ref: { current: Recognition | null }) {
  const recognition = ref.current;
  ref.current = null;
  if (recognition) {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
  }
}

export function VoiceAssistant({ aiProvider = null }: { aiProvider?: "groq" | "ollama" | null }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [readReplies, setReadReplies] = useState(true);
  const [voicedRequest, setVoicedRequest] = useState(false);
  const [receipt, setReceipt] = useState<{ title: string; amount: string; action: string; type: string } | null>(null);
  const [language, setLanguage] = useState("en-BD");
  const [useAI, setUseAI] = useState(Boolean(aiProvider));
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [requestingMicrophone, setRequestingMicrophone] = useState(false);
  const [error, setError] = useState("");
  const [command, setCommand] = useState<VoiceCommand | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const generation = useRef(0);

  useEffect(() => () => { generation.current++; stopRecognition(recognition); window.speechSynthesis?.cancel(); }, []);

  function changeOpen(value: boolean) {
    if (saving) return;
    generation.current++;
    stopRecognition(recognition);
    setListening(false);
    setRequestingMicrophone(false);
    setOpen(value);
    setText("");
    setAlternatives([]);
    setCommand(null);
    setDraft(null);
    setOptions([]);
    setError("");
    setTyping(false);
    setEditingDetails(false);
    setReceipt(null);
    window.speechSynthesis?.cancel();
  }

  function say(message: string) {
    if (!readReplies || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      const voice = window.speechSynthesis.getVoices().find(item => item.lang.startsWith(language.slice(0, 2)));
      if (language.startsWith("bn") && !voice) return;
      if (voice) utterance.voice = voice;
      utterance.lang = language;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch { /* Spoken feedback is optional; the visible review remains available. */ }
  }

  async function listen() {
    if (requestingMicrophone || pending) return;
    window.speechSynthesis?.cancel();
    setError("");
    const Speech = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    if (!window.isSecureContext) {
      setError("Microphone permission requires HTTPS or localhost. Open the secure version of this app and try again.");
      return;
    }
    if (!Speech) {
      setError("This browser does not support speech recognition. Open the app in a browser with speech recognition, or type your command below.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot request microphone access. Open the app in your browser rather than an embedded preview, or type your command.");
      return;
    }
    const version = ++generation.current;
    stopRecognition(recognition);
    setRequestingMicrophone(true);
    try {
      // Explicitly request browser permission before starting its speech service.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Recognition manages its own capture; release the permission-check stream,
      // including when the dialog was closed while the prompt was open.
      stream.getTracks().forEach(track => track.stop());
      if (version !== generation.current) return;
      let spokenText = "";
      let failed = false;
      let ended = false;
      setText("");
      const instance = new Speech();
      recognition.current = instance;
      instance.lang = language;
      instance.maxAlternatives = 3;
      setAlternatives([]);
      instance.continuous = false;
      instance.interimResults = true;
      instance.onresult = event => {
        if (version !== generation.current) return;
        const results = Array.from(event.results);
        spokenText = results.map(result => result[0].transcript).join(" ");
        setText(spokenText);
        const last = results.at(-1);
        const prefix = results.slice(0, -1).map(result => result[0].transcript).join(" ");
        setAlternatives(last ? Array.from(last).slice(1).map(item => `${prefix} ${item.transcript}`.trim()) : []);
      };
      instance.onerror = event => {
        if (version !== generation.current) return;
        failed = true;
        const messages: Record<string, string> = {
          "not-allowed": "Microphone or speech access is blocked. Open the site controls beside your browser’s address bar, set Microphone to Allow, then try again. Also check your device’s microphone privacy settings for this browser.",
          "service-not-allowed": "Your browser blocked speech recognition. You can type your command instead.",
          "audio-capture": "No microphone is available. Connect one or type your command.",
          "no-speech": "No speech was detected. Try again or type your command.",
          "language-not-supported": "This speech service does not support the selected language. Try another language or type your command.",
          network: "Speech recognition could not connect. Check your connection or type your command.",
        };
        setError(messages[event.error] ?? "Speech recognition stopped. Try again or type your command.");
        setListening(false);
      };
      instance.onend = () => {
        if (version !== generation.current || ended) return;
        ended = true;
        setListening(false);
        recognition.current = null;
        if (!failed && spokenText.trim()) review(spokenText, true);
        else if (!failed) setError("I didn’t catch that. Tap the microphone to try again, or type below.");
      };
      instance.start();
      setListening(true);
    } catch (err) {
      if (version !== generation.current) return;
      stopRecognition(recognition);
      setListening(false);
      const messages: Record<string, string> = {
        NotAllowedError: "Microphone access is blocked. Open the site controls beside your browser’s address bar, set Microphone to Allow, then try again. If it is already allowed, check your device’s microphone privacy settings for this browser. A website cannot open or change those settings for you.",
        NotFoundError: "No microphone was found. Connect a microphone and try again, or type your command.",
        NotReadableError: "The microphone could not be opened. Check whether another app is using it and try again.",
        SecurityError: "Microphone access is disabled by your browser or site policy. Open the app directly in your browser and check its microphone permissions.",
      };
      setError(messages[err instanceof Error ? err.name : ""] ?? "Could not start the microphone. Try again or type your command.");
    } finally {
      if (version === generation.current) setRequestingMicrophone(false);
    }
  }

  function review(value = text, fromVoice = false) {
    if (pending || !value.trim()) return;
    setText(value);
    setVoicedRequest(fromVoice);
    setError("");
    const version = generation.current;
    startTransition(async () => {
      try {
        let parsed: VoiceCommand;
        if (useAI) {
          const result = await understandVoice({ text: value, today: toDateInputValue() });
          if ("error" in result) throw new Error(result.error);
          parsed = result.command;
        } else parsed = parseVoiceCommand(value);
        if (version !== generation.current) return;
        const settings = await getUserSettings();
        const money = settings?.currency ?? "USD";
        const cats = parsed.entity === "transaction" ? await getCategories() : [];
        const accs = parsed.entity === "transaction" ? await getUserAccounts() : [];
        let matches: Option[] = [];
        if (parsed.action !== "create" && parsed.entity === "transaction") {
          const result = await getTransactions(1, 50, { search: parsed.title });
          if (result.totalCount > 50) throw new Error("More than 50 records match. Use a more specific description.");
          matches = result.transactions.map(t => ({
            label: `${t.description} · ${formatCurrency(t.amount, money)} · ${t.date.toISOString().slice(0, 10)} · ${t.category.name}`,
            draft: { id: t.id, title: t.description, amount: String(parsed.action === "edit" ? parsed.amount : t.amount), type: t.type, date: t.date.toISOString().slice(0, 10), categoryId: t.categoryId, accountId: t.accountId ?? "", notes: t.notes ?? "", dueDate: "", includeInTotal: true },
          }));
        } else if (parsed.action !== "create") {
          const loans = await getLoans();
          matches = loans.filter(l => l.personName.toLowerCase().includes(parsed.title.toLowerCase())).map(l => ({
            label: `${l.personName} · ${l.loanType === "BORROWED" ? "Borrowed" : "Lent"} · ${formatCurrency(l.principalAmount, money)} · ${l.startDate.toISOString().slice(0, 10)} · ${l.status}`,
            draft: { id: l.id, title: l.personName, amount: String(parsed.action === "edit" ? parsed.amount : l.principalAmount), type: l.loanType, date: l.startDate.toISOString().slice(0, 10), categoryId: "", accountId: "", notes: l.notes ?? "", dueDate: l.dueDate?.toISOString().slice(0, 10) ?? "", includeInTotal: l.includeInTotal },
          }));
        }
        if (version !== generation.current) return;
        if (parsed.action !== "create" && !matches.length) throw new Error("No matching records found. Try a different description or person's name.");
        setCurrency(money);
        setCategories(cats);
        setAccounts(accs);
        setOptions(matches);
        setCommand(parsed);
        setEditingDetails(false);
        if (fromVoice) say(language.startsWith("bn") ? "বুঝেছি। তথ্যগুলো দেখে নিশ্চিত করুন।" : parsed.action === "delete" ? "Choose the record you want to delete, then confirm." : parsed.action === "edit" ? "Choose the record you want to update." : `Got it. Please review your ${typeLabels[parsed.type ?? ""].toLowerCase()} of ${formatCurrency(parsed.amount ?? 0, money)}, then confirm.`);
        const matchingCategories = cats.filter(c => c.type === parsed.type && c.name.toLowerCase() === (parsed.category ?? parsed.title).toLowerCase());
        setDraft(parsed.action === "create" ? {
          title: parsed.title, amount: String(parsed.amount), type: parsed.type!, date: parsed.date,
          categoryId: matchingCategories.length === 1 ? matchingCategories[0].id : "", accountId: "", notes: "", dueDate: "", includeInTotal: true,
        } : null);
      } catch (err) {
        if (version === generation.current) {
          const message = err instanceof Error ? err.message : "Could not prepare your command. Try again.";
          setError(message);
          if (fromVoice) say(message);
        }
      }
    });
  }

  function save() {
    if (!command || !draft || pending) return;
    setSaving(true);
    setError("");
    startTransition(async () => {
      try {
        let result;
        if (command.action === "delete") {
          result = command.entity === "transaction" ? await deleteTransaction(draft.id!) : await deleteLoan(draft.id!);
        } else {
          const data = new FormData();
          if (command.entity === "transaction") {
            Object.entries({ description: draft.title, amount: draft.amount, type: draft.type, date: draft.date, categoryId: draft.categoryId, accountId: draft.accountId, notes: draft.notes }).forEach(([key, value]) => data.set(key, value));
            result = command.action === "edit" ? await updateTransaction(draft.id!, data) : await createTransaction(data);
          } else {
            Object.entries({ personName: draft.title, principalAmount: draft.amount, loanType: draft.type, startDate: draft.date, dueDate: draft.dueDate, notes: draft.notes, includeInTotal: String(draft.includeInTotal) }).forEach(([key, value]) => data.set(key, value));
            result = command.action === "edit" ? await updateLoan(draft.id!, data) : await createLoan(data);
          }
        }
        if (result.error) setError(result.error);
        else {
          if ("success" in result) toast.success(result.success);
          setReceipt({ title: draft.title, amount: formatCurrency(Number(draft.amount), currency), action: command.action, type: typeLabels[draft.type] ?? "Record" });
          if (voicedRequest) say(language.startsWith("bn") ? "হয়ে গেছে। আপনার তথ্য সেভ হয়েছে।" : command.action === "delete" ? "Done. The selected record was deleted." : "Done. Your changes are saved.");
          setDraft(null); setCommand(null); setOptions([]); setText("");
        }
      } catch { setError("Could not complete the request. Check your records before retrying."); }
      finally { setSaving(false); }
    });
  }

  function field(key: keyof Draft, value: string | boolean) { setDraft(current => current ? { ...current, [key]: value } : current); }

  const busy = pending || listening || requestingMicrophone;
  const examples = language.startsWith("bn") ? ["বাজারে ৫০০ টাকা খরচ করেছি", "বেতন থেকে ৩০০০০ টাকা পেয়েছি", "রহিমকে ১০০০ টাকা ধার দিয়েছি"] : ["Spent 500 on groceries", "Received 30000 from salary", "Lent 1000 to Alex"];
  const readyToSave = draft && draft.title.trim() && Number(draft.amount) > 0 && draft.date && (command?.entity === "loan" || draft.categoryId);
  const dateLabel = draft?.date ? new Date(`${draft.date}T12:00:00Z`).toLocaleDateString(language.startsWith("bn") ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Choose a date";
  const summaryTone = draft?.type === "EXPENSE" ? "text-expense bg-expense-soft" : draft?.type === "INCOME" ? "text-income bg-income-soft" : "text-primary bg-primary-soft";
  const SummaryIcon = command?.entity === "loan" ? Landmark : draft?.type === "INCOME" ? ArrowDownLeft : ArrowUpRight;

  function changeRequest() {
    window.speechSynthesis?.cancel();
    setCommand(null); setDraft(null); setOptions([]); setError(""); setTyping(true); setEditingDetails(false);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <Button variant="outline" className="h-10 rounded-xl border-transparent bg-primary-soft text-primary hover:bg-secondary" onClick={() => changeOpen(true)} aria-label="Open voice assistant" title="Use voice">
        <Mic className="h-4 w-4" /><span className="hidden sm:inline">Use voice</span>
      </Button>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-lg sm:p-7" showCloseButton={!saving}>
        <DialogHeader className="pr-6">
          <DialogTitle>Monexa voice</DialogTitle>
          <DialogDescription>{receipt ? "All taken care of." : command ? "A quick check before we make the change." : "Tell me what changed. I’ll prepare the details."}</DialogDescription>
        </DialogHeader>

        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-sm leading-relaxed text-danger"><span className="min-w-0 flex-1">{error}</span><button aria-label="Dismiss message" className="shrink-0 rounded p-1 focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}

        {receipt ? <div className="space-y-5">
          <div role="status" className="rounded-3xl bg-primary-soft px-5 py-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">{receipt.action === "delete" ? "Record deleted" : receipt.action === "edit" ? "Changes saved" : `${receipt.type} added`}</h3>
            <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums">{receipt.amount}</p><p className="mt-1 break-words text-sm text-muted-foreground">{receipt.title}</p>
          </div>
          <Button className="h-12 w-full" onClick={() => { setReceipt(null); setText(""); setTyping(false); setAlternatives([]); }}>Record something else</Button>
          <Button variant="ghost" className="w-full" onClick={() => changeOpen(false)}>Done</Button>
        </div> : !command ? <>
          <div className="rounded-3xl bg-muted px-4 py-5 sm:px-6">
            <div className="flex items-center justify-center gap-3">
              <label className="min-w-0"><span className="sr-only">Speech language</span><select className="h-9 max-w-48 rounded-full border border-border bg-card px-3 text-xs text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={language} disabled={busy} onChange={event => setLanguage(event.target.value)}>{speechLanguages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <button aria-label="Spoken replies" title={readReplies ? "Turn spoken replies off" : "Turn spoken replies on"} aria-pressed={readReplies} disabled={busy} onClick={() => { if (readReplies) window.speechSynthesis?.cancel(); setReadReplies(!readReplies); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{readReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
            </div>
            <div className="flex flex-col items-center py-5">
              <button type="button" aria-label={requestingMicrophone ? "Waiting for microphone permission" : listening ? "Stop listening" : "Start listening"} aria-pressed={listening} disabled={pending || requestingMicrophone} onClick={() => listening ? recognition.current?.stop() : void listen()} className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-card text-primary-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-muted disabled:cursor-wait ${listening ? "bg-primary motion-safe:animate-pulse" : "bg-primary hover:bg-primary-hover"}`}>
                {pending || requestingMicrophone ? <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin motion-reduce:animate-none" /> : listening ? <Square aria-hidden="true" className="h-7 w-7" /> : <Mic aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />}
              </button>
              <div role="status" aria-live="polite" className="mt-4 text-center"><p className="text-base font-semibold tracking-tight">{pending ? "Working on that…" : requestingMicrophone ? "Allow microphone access" : listening ? "I’m listening…" : text ? "Want to change something?" : "Ready when you are"}</p><p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">{pending ? "Finding the amount, date, and other details." : requestingMicrophone ? "Choose Allow in your browser’s permission prompt." : listening ? "Speak naturally. I’ll prepare it when you finish." : text ? "Speak again, or edit what I heard below." : "Tap the microphone and tell me about one transaction or loan."}</p></div>
            </div>
          </div>

          {(text || typing || listening) && <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="voice-transcript">{listening ? "Hearing you" : "Your words"}</label>
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-3 focus-within:border-ring">
              <textarea id="voice-transcript" autoFocus={typing} aria-label="Your command" className="min-h-16 w-full resize-y bg-transparent text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground sm:text-sm" value={text} disabled={busy} onChange={event => { setText(event.target.value); setAlternatives([]); }} maxLength={500} placeholder={language.startsWith("bn") ? "গতকাল বাজারে ৫০০ টাকা খরচ করেছি" : "I spent 500 on groceries yesterday"} />
              <Button size="icon" className="h-10 w-10 rounded-xl" aria-label="Prepare my request" disabled={busy || !text.trim()} onClick={() => review()}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}</Button>
            </div>
            <p className="text-xs text-muted-foreground">You’ll check the details before anything is saved.</p>
          </div>}
          {!text && !typing && !listening && <button disabled={busy} className="mx-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setTyping(true)}><Pencil className="h-3.5 w-3.5" />Type instead</button>}
          {alternatives.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Did I hear that differently?</summary><div className="mt-2 space-y-2">{alternatives.map(item => <button key={item} disabled={busy} className="block w-full rounded-xl border border-border p-3 text-left" onClick={() => { setText(item); setAlternatives([]); review(item); }}>{item}</button>)}</div></details>}
          {!text && !typing && <div><p className="mb-2 text-xs text-muted-foreground">Try saying</p><div className="flex flex-wrap gap-2">{examples.map(example => <button key={example} disabled={busy} className="rounded-xl border border-border px-3 py-2 text-left text-xs text-secondary-foreground transition-colors hover:border-primary-border hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => review(example)}>{example}</button>)}</div></div>}
          <details className="border-t border-border pt-3 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer rounded py-1 font-medium focus-visible:ring-2 focus-visible:ring-ring">Voice preferences</summary><div className="mt-3 space-y-3"><label className="block space-y-1">Command mode<select className={selectClass} value={useAI ? "ai" : "basic"} disabled={busy} onChange={event => setUseAI(event.target.value === "ai")}><option value="basic">Simple phrases</option><option value="ai" disabled={!aiProvider}>{aiProvider ? "Natural language (AI)" : "Natural language unavailable"}</option></select></label><p className="leading-relaxed">{useAI ? `Your words are interpreted by ${aiProvider === "groq" ? "Groq" : "the app’s Ollama service"}. Your transaction history is not shared.` : "Simple phrases work without an AI service."} Speech may be processed online by your browser’s speech service. Spoken replies depend on your device’s available voices.</p></div></details>
        </> : <>
          <button className="flex w-fit items-center gap-2 rounded-lg py-1 text-xs font-medium text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" disabled={pending} onClick={changeRequest}><ArrowLeft className="h-3.5 w-3.5" />Change request</button>
          <div className="rounded-2xl bg-muted px-4 py-3"><p className="text-xs text-muted-foreground">You said</p><p className="mt-1 break-words text-sm leading-relaxed">{text}</p></div>
          {options.length > 0 && !draft && <div className="space-y-3"><div><h3 className="font-semibold">Which {command.entity} did you mean?</h3><p className="mt-1 text-xs text-muted-foreground">Choose the exact record to {command.action === "edit" ? "update" : "delete"}.</p></div><div className="max-h-64 space-y-2 overflow-y-auto">{options.map(option => <button key={option.draft.id} disabled={pending} className="block w-full rounded-2xl border border-border p-4 text-left text-sm leading-relaxed hover:border-primary-border hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setDraft(option.draft); setError(""); }}>{option.label}</button>)}</div></div>}
          {draft && <>
            <div className="rounded-3xl border border-border p-5">
              <div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${summaryTone}`}><SummaryIcon className="h-4 w-4" /></span><h3 className="text-sm font-medium">{command.action === "delete" ? `Delete ${command.entity}` : command.action === "edit" ? `Update ${command.entity}` : typeLabels[draft.type]}</h3></div>
              <p className="mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums">{formatCurrency(Number(draft.amount) || 0, currency)}</p>
              <p className="mt-2 break-words font-medium">{draft.title}</p><p className="mt-1 text-xs text-muted-foreground">{draft.type === "BORROWED" ? "Borrowed from this person · " : draft.type === "LENT" ? "Lent to this person · " : ""}{dateLabel}</p>
              {options.length > 0 && <button disabled={pending} className="mt-4 rounded text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setDraft(null)}>Choose a different record</button>}
            </div>
            {command.action === "delete" ? <div className="space-y-4"><p className="rounded-2xl bg-danger-soft p-4 text-sm leading-relaxed text-danger">{command.entity === "loan" ? "This removes the loan, repayments, and activity history." : "The linked account balance will be adjusted."} This cannot be undone.</p><Button variant="destructive" className="h-12 w-full" disabled={pending} onClick={save}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Delete this {command.entity}</Button></div> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); save(); }}>
              <fieldset disabled={pending} className="space-y-4">
                {command.entity === "transaction" && <div className="space-y-2 text-sm font-medium"><label htmlFor="voice-category">Category</label><select id="voice-category" required className={selectClass} value={draft.categoryId} onChange={event => field("categoryId", event.target.value)}><option value="">Choose a category</option>{categories.filter(category => category.type === draft.type).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>}
                <button type="button" aria-expanded={editingDetails} className="flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setEditingDetails(!editingDetails)}><Pencil className="h-3.5 w-3.5" />{editingDetails ? "Hide details" : "Edit details"}</button>
                {editingDetails && <div className="grid gap-4 rounded-2xl bg-muted p-4">
                  <label className="space-y-1 text-sm">{command.entity === "loan" ? "Person’s name" : "Description"}<Input required value={draft.title} onChange={event => field("title", event.target.value)} /></label>
                  <label className="space-y-1 text-sm">Amount ({currency})<Input required type="number" step="0.01" min="0.01" value={draft.amount} onChange={event => field("amount", event.target.value)} /></label>
                  <label className="space-y-1 text-sm">Type<select className={selectClass} value={draft.type} onChange={event => { field("type", event.target.value); field("categoryId", ""); }}>{(command.entity === "loan" ? ["BORROWED", "LENT"] : ["EXPENSE", "INCOME"]).map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
                  <label className="space-y-1 text-sm">Date<Input required type="date" value={draft.date} onChange={event => field("date", event.target.value)} /></label>
                  {command.entity === "transaction" && <label className="space-y-1 text-sm">Account<select className={selectClass} value={draft.accountId} onChange={event => field("accountId", event.target.value)}><option value="">No linked account</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
                  {command.entity === "loan" && <><label className="space-y-1 text-sm">Due date (optional)<Input type="date" value={draft.dueDate} onChange={event => field("dueDate", event.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.includeInTotal} onChange={event => field("includeInTotal", event.target.checked)} />Include in totals</label></>}
                  <label className="space-y-1 text-sm">Notes (optional)<Input value={draft.notes} onChange={event => field("notes", event.target.value)} /></label>
                </div>}
                {!readyToSave && <p className="text-xs text-muted-foreground">{!draft.categoryId && command.entity === "transaction" ? "Choose a category to finish this entry." : "Complete the amount, date, and description in Edit details."}</p>}
                <Button type="submit" className="h-12 w-full" disabled={!readyToSave}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{pending ? "Saving…" : command.action === "edit" ? "Save changes" : `Add ${command.entity === "loan" ? "loan" : draft.type === "INCOME" ? "income" : "expense"}`}</Button>
              </fieldset>
            </form>}
          </>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
