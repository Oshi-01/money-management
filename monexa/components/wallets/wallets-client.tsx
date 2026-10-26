"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone, Plus, Pencil, Wallet as WalletIcon, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { saveWallet } from "@/app/actions/wallets";
import { formatCurrency } from "@/lib/utils";
import { isCreditWallet, walletInputAmount, walletLast4, walletProvider, walletProviders, walletTotals, type Wallet, type WalletInput } from "@/shared/wallets";

export function WalletsClient({ wallets, currency }: { wallets: Wallet[]; currency: string }) {
  const router = useRouter();
  const [target, setTarget] = useState<Wallet | "new" | null>(null);
  const [name, setName] = useState("bKash");
  const [type, setType] = useState<WalletInput["type"]>("BKASH");
  const [last4, setLast4] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [pending, startTransition] = useTransition();
  const totals = walletTotals(wallets);
  const credit = isCreditWallet(type);
  const card = type.startsWith("VISA");

  function open(wallet?: Wallet) {
    setTarget(wallet ?? "new"); setError(""); setConflict(false);
    setName(wallet?.name ?? "bKash"); setType(wallet ? walletProvider(wallet.type).value : "BKASH");
    setLast4(walletLast4(wallet?.prefix ?? null)); setAmount(wallet ? String(walletInputAmount(wallet)) : "");
  }

  function save() {
    if (pending || !target || conflict) return;
    const value = Number(amount);
    if (!name.trim() || !amount.trim() || !Number.isFinite(value)) { setError("Enter a name and a valid amount."); return; }
    setError("");
    startTransition(async () => {
      try {
        const input = { name, type, last4, amount: value };
        const result = await saveWallet(target === "new" ? input : { ...input, updatedAt: target.updatedAt, previousBalance: target.balance }, target === "new" ? undefined : target.id);
        if ("error" in result) { setError(result.error ?? "Could not save this wallet."); setConflict(Boolean(result.conflict)); return; }
        toast.success(target === "new" ? "Wallet added" : "Recorded balance updated");
        setTarget(null); router.refresh();
      } catch { setError("Could not confirm the save. Check your wallets before retrying."); }
    });
  }

  return <div className="space-y-6 pb-8">
    <PageHeader title="Wallets & cards" description="Your mobile money and cards, together.">
      <Button className="h-11" onClick={() => open()}><Plus className="h-4 w-4" />Add wallet or card</Button>
    </PageHeader>

    <div className="app-panel grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="p-5 sm:p-6"><p className="text-xs text-muted-foreground">Recorded wallet & debit balances</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(totals.available, currency)}</p></div>
      <div className="p-5 sm:p-6"><p className="text-xs text-muted-foreground">Credit card amount owed</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight text-expense tabular-nums">{formatCurrency(totals.owed, currency)}</p></div>
      <div className="flex flex-col justify-center gap-2 p-5 sm:p-6"><p className="text-sm font-medium">Manual tracking</p><p className="text-xs leading-relaxed text-muted-foreground">Balances update with transactions you link in Monexa. Live provider sync is not connected.</p></div>
    </div>

    {wallets.length === 0 ? <div className="app-panel px-5 py-12 text-center sm:py-16"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><WalletIcon className="h-6 w-6" /></span><h2 className="mt-5 text-xl font-semibold tracking-tight">Where do you keep your money?</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Add bKash, Nagad, Rocket, or a Visa debit or credit card. Start with the balance you see in your provider’s app.</p><Button className="mt-6 h-11" onClick={() => open()}>Add your first wallet</Button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {wallets.map(wallet => {
        const provider = walletProvider(wallet.type);
        const isCard = wallet.type.startsWith("VISA");
        const isCredit = isCreditWallet(wallet.type);
        const owed = isCredit && wallet.balance <= 0;
        const value = owed ? -wallet.balance : wallet.balance;
        const Icon = isCard ? CreditCard : provider.kind === "Mobile wallet" ? Smartphone : WalletIcon;
        return <section key={wallet.id} aria-label={wallet.name} className="app-panel flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon aria-hidden="true" className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{provider.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{provider.kind}</p></div></div><Button variant="ghost" size="icon" aria-label={`Edit ${wallet.name}`} onClick={() => open(wallet)}><Pencil className="h-4 w-4" /></Button></div>
          <h2 className="mt-6 break-words text-base font-medium">{wallet.name}</h2><p className="mt-1 text-xs text-muted-foreground">{walletLast4(wallet.prefix) ? `Ending in ${walletLast4(wallet.prefix)}` : "No account number stored"}</p>
          <p className="mt-6 text-xs text-muted-foreground">{isCredit ? owed ? "Amount owed" : "Credit balance" : "Recorded balance"}</p><p className={`mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums ${owed && value > 0 ? "text-expense" : "text-foreground"}`}>{formatCurrency(value, currency)}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><span>Manual</span><time dateTime={wallet.updatedAt}>Changed {new Date(wallet.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></div>
        </section>;
      })}
    </div>}
    <p className="flex flex-wrap items-center gap-x-1 gap-y-2 px-1 text-xs leading-relaxed text-muted-foreground">When adding a transaction, choose its wallet in the Account field. <Link className="inline-flex items-center gap-1 rounded font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring" href="/dashboard/transactions">Open transactions<ArrowUpRight className="h-3 w-3" /></Link></p>

    <Dialog open={target !== null} onOpenChange={value => { if (!pending && !value) setTarget(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader className="pr-6"><DialogTitle>{target === "new" ? "Add wallet or card" : "Update wallet details"}</DialogTitle><DialogDescription>{target === "new" ? "Keep a recorded balance alongside your transactions." : "Use your provider’s app or statement to check this balance."}</DialogDescription></DialogHeader>
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); save(); }}>
          <fieldset disabled={pending || conflict} className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="wallet-provider">Provider / card type</label><select id="wallet-provider" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" value={type} onChange={event => { const next = event.target.value as WalletInput["type"]; if (walletProviders.some(provider => provider.label === name)) setName(walletProvider(next).label); setType(next); }}>{walletProviders.map(provider => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="wallet-name">{card ? "Card name / issuing bank" : "Wallet name"}</label><Input id="wallet-name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder={card ? "e.g. BRAC Bank Visa" : "e.g. My bKash"} /></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="wallet-last4">Last four digits (optional)</label><Input id="wallet-last4" inputMode="numeric" maxLength={4} pattern="[0-9]{4}|" value={last4} onChange={event => setLast4(event.target.value.replace(/\D/g, ""))} placeholder="1234" /><p className="text-xs text-muted-foreground">Only the last four digits are stored.</p></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="wallet-amount">{credit ? "Amount owed" : "Current balance"} ({currency})</label><Input id="wallet-amount" required type="number" step="0.01" min={-1e12} max={1e12} value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" />{credit && <p className="text-xs leading-relaxed text-muted-foreground">Enter the amount you owe. If your card has a positive credit balance, enter that amount with a minus sign.</p>}</div>
          </fieldset>
          <p className="rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">This does not connect to your provider. Direct balance sync needs an approved provider connection.</p>
          {conflict ? <Button type="button" className="h-11 w-full" onClick={() => { setTarget(null); router.refresh(); }}>Discard edits and refresh</Button> : <Button type="submit" disabled={pending} className="h-11 w-full">{pending ? "Saving…" : target === "new" ? "Add wallet" : "Save recorded balance"}</Button>}
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
