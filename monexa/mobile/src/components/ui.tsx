import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewProps } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing, radius, textSize } from "../theme/layout";

export { colors } from "../theme/colors";
export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView></SafeAreaView>;
}
export function Card({ children, style, ...props }: ViewProps) { return <View style={[styles.card, style]} {...props}>{children}</View>; }
export function Title({ children }: { children: ReactNode }) { return <Text accessibilityRole="header" style={styles.title}>{children}</Text>; }
export function Hint({ children }: { children: ReactNode }) { return <Text style={styles.hint}>{children}</Text>; }
export function ErrorMessage({ message }: { message?: string }) { return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null; }
export function Action({ title, accessibilityLabel, onPress, busy = false, disabled = false, danger = false, secondary = false }: { title: string; accessibilityLabel?: string; onPress(): void; busy?: boolean; disabled?: boolean; danger?: boolean; secondary?: boolean }) {
  const onColor = danger || !secondary ? colors.onPrimary : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={[styles.button, secondary && styles.secondary, danger && { backgroundColor: colors.danger }, (disabled || busy) && { opacity: 0.5 }]}>{busy && <ActivityIndicator color={onColor} />}<Text style={[styles.buttonText, { color: onColor }]}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance="light" style={styles.input} {...props} /></View>;
}
export function Choices({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange(value: string): void }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><View style={styles.row}>{options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: option.value === value }} onPress={() => onChange(option.value)} style={[styles.chip, option.value === value && { backgroundColor: colors.primary }]}><Text style={{ color: option.value === value ? colors.onPrimary : colors.text }}>{option.label}</Text></Pressable>)}</View></View>;
}
export function money(value: number, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value); }
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.border, gap: 10 },
  title: { color: colors.text, fontSize: textSize.title, fontWeight: "700" },
  label: { color: colors.text, fontSize: textSize.body, fontWeight: "600" },
  hint: { color: colors.muted, lineHeight: 21 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: spacing.md, borderRadius: radius.control, lineHeight: 21 },
  input: { color: colors.text, backgroundColor: colors.surface, borderColor: colors.input, borderWidth: 1, borderRadius: radius.control, minHeight: 48, padding: spacing.md, fontSize: 16 },
  button: { minHeight: 48, borderRadius: radius.control, padding: spacing.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondary: { backgroundColor: colors.subtle },
  buttonText: { color: colors.onPrimary, fontSize: textSize.body, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { padding: 10, borderRadius: radius.control, backgroundColor: colors.subtle, minHeight: 44, justifyContent: "center" },
});
