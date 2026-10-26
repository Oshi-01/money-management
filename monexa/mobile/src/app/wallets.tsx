import { useCallback, useRef, useState } from "react";
import { Redirect, router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { isCreditWallet, walletLast4, walletProvider, walletTotals, type Wallet } from "../../../shared/wallets";
import { useSession } from "../lib/session";
import { Action, Card, colors, ErrorMessage, Hint, money, Screen, styles, Title } from "../components/ui";

export default function WalletsScreen() {
  const { api, data, token, loading: restoring } = useSession();
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!token) return;
    const version = ++generation.current;
    setLoading(true); setError("");
    try {
      const result = await api<{ wallets: Wallet[] }>("accounts");
      if (version === generation.current) setWallets(result.wallets);
    } catch (err) { if (version === generation.current) setError((err as Error).message); }
    finally { if (version === generation.current) setLoading(false); }
  }, [api, token]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  if (!restoring && !token) return <Redirect href="/" />;
  const totals = walletTotals(wallets ?? []);
  return <Screen><Title>Wallets &amp; cards</Title><Hint>Track bKash, Nagad, Rocket, and Visa debit or credit cards.</Hint><ErrorMessage message={error} />
    <Action title="Add wallet or card" onPress={() => router.push("/wallet")} />
    <Card><Text style={styles.label}>Manual tracking</Text><Hint>Balances update with linked transactions in Monexa. Live provider sync is not connected.</Hint></Card>
    {wallets === null && loading ? <ActivityIndicator color={colors.primary} /> : wallets !== null ? <>
      <Card><Hint>Recorded wallet &amp; debit balances</Hint><Text style={styles.label}>{money(totals.available, data?.user.currency)}</Text><Hint>Credit card amount owed</Hint><Text style={[styles.label, { color: colors.expense }]}>{money(totals.owed, data?.user.currency)}</Text></Card>
      {wallets.length === 0 ? <Card><Text style={styles.label}>Where do you keep your money?</Text><Hint>Add your first wallet using the balance shown in your provider’s app.</Hint></Card> : wallets.map(wallet => {
        const credit = isCreditWallet(wallet.type);
        const owed = credit && wallet.balance <= 0;
        return <Card key={wallet.id}><Text style={styles.label}>{wallet.name}</Text><Hint>{walletProvider(wallet.type).label}{walletLast4(wallet.prefix) ? ` · Ending in ${walletLast4(wallet.prefix)}` : ""}</Hint><Hint>{credit ? owed ? "Amount owed" : "Credit balance" : "Recorded balance"}</Hint><Text style={[styles.label, { fontSize: 26, color: owed && wallet.balance < 0 ? colors.expense : colors.text }]}>{money(owed ? -wallet.balance : wallet.balance, data?.user.currency)}</Text><Hint>Manual · Last changed {new Date(wallet.updatedAt).toLocaleDateString()}</Hint><View><Action title={`Edit ${wallet.name}`} secondary onPress={() => router.push({ pathname: "/wallet", params: { id: wallet.id } })} /></View></Card>;
      })}
    </> : null}
    <Action title={error ? "Retry loading wallets" : "Refresh list"} secondary busy={loading} onPress={() => { void load(); }} />
  </Screen>;
}
