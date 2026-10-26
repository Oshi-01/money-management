This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev run
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Color system

Monexa uses a fixed light appearance on web and mobile. The palette lives in
`shared/colors.json`: blue for actions/selection, green for income and completion,
ochre for expenses and money owed, amber for warnings, and red for errors and
destructive actions. Neutral surfaces and progress graphics keep data readable.
See [color meanings and usage rules](docs/color-system.md).

Web components use semantic Tailwind classes such as `bg-card`, `text-foreground`,
`text-muted-foreground`, `bg-primary`, and `text-expense`. Charts use CSS variables
such as `var(--chart-income)`. Mobile components use `mobile/src/theme/colors.ts`.
Avoid new hardcoded colors in screens.

After editing the palette, run `npm run colors:generate` to update the checked-in
`app/colors.css`. This runs automatically before website development/builds.
`node scripts/generate-colors.mjs --check` checks that the generated CSS is current.
Mobile navigation and keyboards stay light regardless of system appearance.

## React Native mobile app

The `mobile/` npm workspace contains the Expo app for Android and iPhone, with
login, dashboard totals, transaction and loan management, repayments, additional
loan amounts, and native voice commands. The website and mobile app share server
services and the same PostgreSQL data. See [mobile setup](mobile/README.md) for
environment variables, development builds, and the API contract.

Install both apps with `npm install` at this repository root. Run the website
with `npm run dev` and Metro with `npm run mobile`. Native speech requires an Expo
development build. The mobile session migration is prepared in
`prisma/migrations/20261026140000_add_mobile_sessions/`; deploy it to the intended
database before using mobile login. It has not been applied to the configured
application database by this implementation.

Run `npm run test:mobile-api` for database-backed API integration tests. This
creates and removes an isolated database on local PostgreSQL and never uses
the application’s `DATABASE_URL`.

## Voice commands

The dashboard’s **Voice** button and mobile voice tab accept English/Bangla
speech or typed commands. On the website, tap the microphone and speak; Monexa
automatically prepares a review when you finish. Use **Type instead** for written
requests, **Edit details** to change fields, and **Voice preferences** to switch
between simple phrases and natural language (AI). Spoken replies are optional.
See [voice setup and limitations](docs/voice-assistant.md).

- `Add expense 500 for groceries`
- `Add income 30000 from salary`
- `Borrow 2000 from Rahim` or `Lend 1000 to Alex`
- `Edit transaction lunch to 250` or `Edit loan Rahim to 3000`
- `Delete transaction lunch` or `Delete loan Rahim`
- `I paid five hundred taka for groceries two days ago`
- `গতকাল বাজারে ৫০০ টাকা খরচ করেছি`

New entries default to today. Add `yesterday`, `two days ago`, or `October 20`
to set a date, or `in Dining Out`
to specify a transaction category. Amounts can use digits or words such as
`five hundred`. All amounts use the user’s configured currency; no currency
conversion takes place. One command is handled at a time.

Every command opens a review screen. Edits and deletions require selecting a
matching record, even when only one matches. Edits change the amount initially;
other fields can be changed in review. Nothing is saved until confirmation.
Deleting a loan also deletes its repayment and activity history.

Speech uses the browser’s `SpeechRecognition` / `webkitSpeechRecognition` API,
requires microphone permission and HTTPS (or localhost), and may send audio to
the browser vendor’s recognition service. Browser support varies. Typed commands
work without a microphone. Basic understanding needs no API key or database
migration. AI understanding supports flexible English, Bangla, and mixed phrasing
through a server-configured Groq key or local Ollama model; it remains optional.
This module covers transactions and loans; other app entities are unsupported.

Tap **Start speaking** to request microphone access. If access was previously
blocked, use the site controls beside the browser’s address bar to set
**Microphone → Allow**, then retry. Also check the operating system’s microphone
permission for the browser. The app allows microphone access for its own origin
through `Permissions-Policy: microphone=(self)`. Restart the server or redeploy
after changing this header, then reload the page.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Wallets and cards

Track bKash, Nagad, Rocket, and Visa debit/credit cards under **Wallets & cards**.
Linked transactions update recorded balances; card debt is shown separately.
These are manual accounts, with masked last-four-digit identifiers. Live provider
balance synchronization is not connected. See [wallet behavior and integration
requirements](docs/wallets.md).
