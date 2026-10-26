import { z } from "zod";

export class MobileApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function mobileJson(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...extra } });
}

export async function readMobileJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new MobileApiError("Send JSON with Content-Type: application/json", 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new MobileApiError("A JSON body is required");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new MobileApiError("Request is too large", 413); }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch { throw new MobileApiError("Invalid JSON"); }
}

export const transactionInput = z.object({
  description: z.string().trim().min(1).max(300), amount: z.number().positive().max(1e12),
  type: z.enum(["INCOME", "EXPENSE"]), categoryId: z.string().min(1).max(100),
  accountId: z.string().max(100).optional(), date: z.iso.date(), notes: z.string().max(2000).optional(),
});
export const loanInput = z.object({
  personName: z.string().trim().min(1).max(200), principalAmount: z.number().positive().max(1e12),
  loanType: z.enum(["BORROWED", "LENT"]), startDate: z.iso.date(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(), notes: z.string().max(2000).optional(),
  includeInTotal: z.boolean(),
});
export const loanPaymentInput = z.object({ amount: z.number().positive().max(1e12), date: z.iso.date(), notes: z.string().max(2000).optional() });

export function asFormData(data: Record<string, string | number | boolean | undefined>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) if (value !== undefined) form.set(key, String(value));
  return form;
}

export function actionResponse(result: { error?: string; success?: string }, status = 200) {
  if (result.error) {
    const code = /not found/i.test(result.error) ? 404 : /^Failed to /i.test(result.error) ? 500 : 400;
    return mobileJson({ error: result.error }, code);
  }
  return mobileJson({ message: result.success }, status);
}
