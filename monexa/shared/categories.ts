import { z } from "zod";
import type { Category } from "./mobile-api";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(40, "Keep the name under 40 characters."),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
}).strict();
export type ManagedCategory = Category & { isSystem: boolean; transactions: number; budgets: number };
