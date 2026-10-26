import { z } from "zod";

export const voiceCommandSchema = z.object({
  action: z.enum(["create", "edit", "delete"]),
  entity: z.enum(["transaction", "loan"]),
  title: z.string().trim().min(1).max(200),
  amount: z.number().positive().max(1e12).optional(),
  type: z.enum(["INCOME", "EXPENSE", "BORROWED", "LENT"]).optional(),
  date: z.iso.date(),
  category: z.string().trim().min(1).max(100).optional(),
}).strict().superRefine((command, context) => {
  if (command.action !== "delete" && command.amount === undefined) context.addIssue({ code: "custom", message: "Specify the amount." });
  if (command.action === "create" && !(command.entity === "loan" ? ["BORROWED", "LENT"] : ["INCOME", "EXPENSE"]).includes(command.type ?? "")) context.addIssue({ code: "custom", message: "Specify whether money came in or went out." });
  if (command.type && !(command.entity === "loan" ? ["BORROWED", "LENT"] : ["INCOME", "EXPENSE"]).includes(command.type)) context.addIssue({ code: "custom", message: "The type does not match this record." });
});

export type VoiceInterpretation = { command: z.infer<typeof voiceCommandSchema>; source: "basic" | "groq" | "ollama" };
export const voiceRequestSchema = z.object({
  text: z.string().trim().min(1).max(500),
  today: z.iso.date(),
}).strict();

export const speechLanguages = [
  { value: "en-BD", label: "English (Bangladesh)" },
  { value: "en-US", label: "English (US)" },
  { value: "bn-BD", label: "বাংলা (বাংলাদেশ)" },
];
