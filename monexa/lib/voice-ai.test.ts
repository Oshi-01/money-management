import { afterEach, describe, expect, it, vi } from "vitest";
import { interpretVoice } from "./voice-ai";

const input = { text: "গতকাল বাজারে পাঁচশ টাকা খরচ করেছি", today: "2026-10-27" };
const expense = { action: "create", entity: "transaction", title: "বাজার", amount: 500, type: "EXPENSE", date: "2026-10-26", category: null, question: null };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function groq(result: unknown) {
  vi.stubEnv("VOICE_AI_PROVIDER", "groq"); vi.stubEnv("GROQ_API_KEY", "test-only");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(result) } }] }));
  vi.stubGlobal("fetch", fetcher); return fetcher;
}

describe("voice understanding", () => {
  it("keeps basic commands free and avoids external requests", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await interpretVoice({ ...input, text: "spent 500 for lunch yesterday" })).toMatchObject({ source: "basic", command: { amount: 500, date: "2026-10-26" } });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("validates dates and bounds before any external request", async () => {
    const fetcher = groq(expense);
    await expect(interpretVoice({ ...input, today: "2026-02-30" }, true)).rejects.toThrow();
    await expect(interpretVoice({ ...input, text: "a".repeat(501) }, true)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reports missing configuration without pretending AI is active", async () => {
    vi.stubEnv("VOICE_AI_PROVIDER", "");
    await expect(interpretVoice(input, true)).rejects.toThrow("server setup");
  });
  it("requests structured output and preserves Bangla descriptions", async () => {
    const fetcher = groq(expense);
    expect(await interpretVoice(input, true)).toEqual({ source: "groq", command: { action: "create", entity: "transaction", title: "বাজার", amount: 500, type: "EXPENSE", date: "2026-10-26" } });
    const [url, init] = fetcher.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toBe(input.text);
    expect(body.messages[0].content).toContain(input.today);
    expect(body.messages[0].content).toContain("Never translate or transliterate Bangla titles");
    expect(body.tools).toBeUndefined();
  });
  it("supports a locally hosted Ollama model", async () => {
    vi.stubEnv("VOICE_AI_PROVIDER", "ollama"); vi.stubEnv("OLLAMA_MODEL", "test-model"); vi.stubEnv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ message: { content: JSON.stringify(expense) } })); vi.stubGlobal("fetch", fetcher);
    expect(await interpretVoice(input, true)).toMatchObject({ source: "ollama" });
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:11434/api/chat");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ model: "test-model", stream: false, format: { type: "object" } });
  });
  it("asks for clarification without preparing an action", async () => {
    groq({ action: "clarify", entity: null, title: null, amount: null, type: null, date: null, category: null, question: "Was that a loan or a gift?" });
    await expect(interpretVoice(input, true)).rejects.toThrow("Was that a loan or a gift?");
  });
  it.each([
    { ...expense, amount: -1 }, { ...expense, amount: null }, { ...expense, entity: "loan" },
    { ...expense, title: "" }, { ...expense, date: "2026-02-30" }, { ...expense, recordId: "invented" },
  ])("rejects invalid model output: %j", async result => {
    groq(result); await expect(interpretVoice(input, true)).rejects.toThrow();
  });
  it("rejects malformed output", async () => {
    groq(expense); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: "not JSON" } }] })));
    await expect(interpretVoice(input, true)).rejects.toThrow("incomplete command");
  });
  it("surfaces limits and timeouts without silently switching interpretations", async () => {
    groq(expense); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429 })));
    await expect(interpretVoice(input, true)).rejects.toThrow("usage limit");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    await expect(interpretVoice(input, true)).rejects.toThrow("too long");
  });
});
