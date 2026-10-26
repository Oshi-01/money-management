# Voice assistant

Web and mobile support English and Bangla speech selection, editable transcripts,
and recognition alternatives when the device provides them. On the website, tap
the microphone and speak: the review opens automatically when recognition ends.
Use **Type instead** to send a written request. The amount, description, and date
appear first; **Edit details** exposes the remaining fields. Every successful save
has a confirmation and an option to record something else.

**Voice preferences** contains **Simple phrases** (Basic) and **Natural language
(AI)** modes. Natural language is selected by default when the server has an AI
provider configured. The speaker button toggles spoken replies, which only play
after voice input and depend on the browser/device’s installed voices. Bangla
feedback is skipped if a Bangla voice is unavailable. Every command opens a review form or record picker; nothing
is saved or deleted by the AI interpreter.

## Basic mode: no AI account or key

`chrono-node` handles English dates such as “yesterday”, “two days ago”, and
“October 20”. The shared parser handles common English commands, spoken English
amounts, decimal amounts, and numeric Bangla commands. Examples:

- `I paid five hundred taka for groceries yesterday`
- `Record expense lunch for 250`
- `Borrow 2k from Rahim`
- `Edit transaction lunch to 250`
- `গতকাল বাজারে ৫০০ টাকা খরচ করেছি`
- `বেতন থেকে ৩০০০০ টাকা পেয়েছি`
- `রহিমের কাছ থেকে ২০০০ টাকা ধার নিয়েছি`
- `রহিমকে ১০০০ টাকা ধার দিয়েছি`
- `লোন রহিম মুছে দাও`

Basic mode uses defined patterns; arbitrary Bangla phrasing and spoken Bangla
number words need AI mode. Basic command interpretation makes no external AI
request. Speech recognition itself still uses the browser/phone's speech service
and may process audio online. Available languages and transcription quality vary
by browser, operating system, microphone, and accent. Select the language you are
speaking; automatic language switching is not guaranteed.

## AI mode with Groq

Groq provides a limited free developer tier. Quotas and available models can
change; check https://console.groq.com/docs/rate-limits and your account limits.
Create your own key in the Groq console and set these **server-only** variables:

```dotenv
VOICE_AI_PROVIDER=groq
GROQ_API_KEY=your-key
GROQ_VOICE_MODEL=openai/gpt-oss-20b
```

Restart the Next.js server, then select **AI** in the voice assistant. No key
belongs in an `EXPO_PUBLIC_` or `NEXT_PUBLIC_` variable. Only the transcript and
local reference date are sent; account history, balances, and records are not sent.

## AI mode with local Ollama

Ollama can run an open model on your own computer/server without per-request API
fees. You supply the machine, memory, and compute. Install Ollama from
https://ollama.com and pull a multilingual instruction model supported by your
hardware, for example `ollama pull qwen3:8b`.

```dotenv
VOICE_AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
```

Ollama must be reachable **from the Next.js server**, including when using a
phone. `127.0.0.1` on a deployed server refers to that server, not your laptop.
Keep this service private. Select a smaller model if necessary; the interpreter
has a 15-second timeout, and model cold starts can exceed it.

## Behavior and limits

AI mode handles flexible English, Bangla, and mixed-language requests, subject to
the selected model's abilities. Missing or uncertain details produce a question;
correct/expand the transcript and review again. One command is supported at a
time. Edits currently change amounts; repayments and other fields use their
existing forms. Existing records are searched using the extracted description or
person's name and must be selected explicitly. Categories remain reviewable.

The interpreter requires authentication, limits AI requests per user, validates
the model's structured response, and has no database mutation tools. Provider
failures are shown explicitly. It never silently switches to a different
interpretation after a failed AI request. Choose Basic manually when needed.

AI mode has been tested with mocked provider responses; real model accuracy and
actual microphone quality must be evaluated with your configured provider and
devices. No hosted key or local model is installed automatically.
