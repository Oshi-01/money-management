import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSession } from "../../lib/session";
import { Action, Card, ErrorMessage, Hint, money, Screen, Title } from "../../components/ui";
import { colors } from "../../theme/colors";
import { spacing, textSize } from "../../theme/layout";

export default function DashboardScreen() {
  const { data, refresh, error } = useSession();
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const totals = data.dashboard;
  return <Screen>
    <Title>Hello, {data.user.name || "there"}</Title>
    <Hint>Your financial overview</Hint>
    <ErrorMessage message={error} />
    <Card style={overviewStyles.overview}>
      <View style={overviewStyles.balance}>
        <Hint>Cash flow balance</Hint>
        <Text style={overviewStyles.balanceAmount}>{money(totals.balance, data.user.currency)}</Text>
        <Text style={overviewStyles.caption}>Recorded income minus spending, including selected loans.</Text>
      </View>
      <View style={overviewStyles.flows}>
        <View style={[overviewStyles.flow, { borderLeftColor: colors.income }]}><Hint>Income</Hint><Text style={[overviewStyles.flowAmount, { color: colors.income }]}>+{money(totals.income, data.user.currency)}</Text></View>
        <View style={[overviewStyles.flow, { borderLeftColor: colors.expense }]}><Hint>Spending</Hint><Text style={[overviewStyles.flowAmount, { color: colors.expense }]}>−{money(totals.expense, data.user.currency)}</Text></View>
      </View>
    </Card>
    <View style={overviewStyles.actionRow}><View style={overviewStyles.action}><Action title="Add transaction" onPress={() => router.push("/transaction")} /></View><View style={overviewStyles.action}><Action title="Use voice" secondary onPress={() => router.push("/(tabs)/voice")} /></View></View>
    <Card style={overviewStyles.loanPanel}>
      <Text style={overviewStyles.sectionTitle}>Outstanding loans</Text>
      <View style={overviewStyles.loanRow}><Text style={overviewStyles.rowLabel}>You owe</Text><Text style={[overviewStyles.rowAmount, { color: colors.expense }]}>{money(totals.borrowed, data.user.currency)}</Text></View>
      <View style={overviewStyles.loanRow}><Text style={overviewStyles.rowLabel}>Owed to you</Text><Text style={[overviewStyles.rowAmount, { color: colors.income }]}>{money(totals.lent, data.user.currency)}</Text></View>
      <Action title="Record loan" secondary onPress={() => router.push("/loan")} />
    </Card>
    <Action title="Refresh totals" secondary busy={busy} onPress={() => { setBusy(true); void refresh().catch(() => {}).finally(() => setBusy(false)); }} />
  </Screen>;
}

const overviewStyles = StyleSheet.create({
  overview: { padding: 0, gap: 0, overflow: "hidden" },
  balance: { padding: spacing.xl, gap: spacing.sm },
  balanceAmount: { fontSize: textSize.balance, fontWeight: "600", letterSpacing: -1, color: colors.text, fontVariant: ["tabular-nums"] },
  caption: { color: colors.muted, fontSize: textSize.caption, lineHeight: 18 },
  flows: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  flow: { flex: 1, minWidth: 110, borderLeftWidth: 3, paddingLeft: spacing.md, gap: spacing.sm },
  flowAmount: { fontSize: textSize.section, fontWeight: "600", fontVariant: ["tabular-nums"] },
  actionRow: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
  loanPanel: { gap: spacing.lg },
  sectionTitle: { fontSize: textSize.section, fontWeight: "600", color: colors.text },
  loanRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.muted, fontSize: textSize.body },
  rowAmount: { fontSize: textSize.body, fontWeight: "600", fontVariant: ["tabular-nums"] },
});
