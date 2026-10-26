# Monexa mobile

Expo SDK 58 / React Native companion app for Android and iPhone. The interface
is intentionally functional; UX refinement can follow without replacing the API
or data model.

The app uses a fixed light appearance. Colors are shared with the website through
`shared/colors.json` and exposed by `src/theme/colors.ts`. Navigation, inputs,
status colors, and controls use these tokens. `expo-system-ui` enables the native
light appearance lock on Android; rebuild an existing development client after
adding this module so platform appearance settings take effect.

Implemented: existing-account login, secure session restoration, logout,
dashboard totals, searchable/paginated transactions, transaction creation/editing/
deletion, borrowed/lent loans, repayments, additional principal, repayment
history, and English/Bangla voice commands with review and deletion confirmation.

Budgets, savings, reports, profile editing, native registration/password reset,
offline writes, push notifications, and store submission are outside this first
version. Registration and password reset remain available on the website.

## Server setup

The existing Next.js app serves the native JSON API at `/api/mobile`. It uses
the same business services as the website. Mobile requests use opaque bearer
tokens; only SHA-256 token digests are stored on the server. Sessions expire
after 30 days, are revoked on logout, and become invalid after a password reset
increments `sessionVersion`.

The additive migration adds `MobileSession` and its indexes and foreign key.
It does not alter transaction or loan data. It was generated with Prisma Migrate
and tested against a disposable local PostgreSQL database. It has not been
applied to the application’s configured database.

After reviewing the target database and arranging the usual backup, apply pending
migrations through the existing deployment workflow (`vercel-build` runs
`prisma migrate deploy`), or run `npx prisma migrate deploy` against the explicitly
selected development database. Do not point test commands at production.

## Install and connect

Run from the repository root:

```sh
npm install
cp mobile/.env.example mobile/.env.local
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env.local` to the origin of your running
Next.js server, for example `https://money.example.com`. The app appends
`/api/mobile` itself. This is public configuration, never a database URL or secret.

For a physical phone, the server must be reachable from that phone. `localhost`
on a phone refers to the phone itself. Use a deployed HTTPS server or a trusted
HTTPS development endpoint. HTTP is allowed by the JavaScript client only in
development; device transport policies may still require HTTPS.

The Next.js server needs its existing database and auth environment variables.
No database credentials or `AUTH_SECRET` belong in the mobile app.

Start the website and Metro in separate terminals:

```sh
npm run dev
npm run mobile
```

## Install a development build

Native speech recognition requires a development build; Expo Go does not include
this native module. EAS profiles are provided in `eas.json`.

From `mobile/`, link this app to your Expo project and build:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android
# For iPhone:
npx eas-cli@latest build --profile development --platform ios
```

Install the resulting development build on your phone, then connect it to Metro.
Use the Expo project’s signing setup and device registration for iPhone builds.
The identifiers `com.monexa.mobile` are provisional; choose your organization’s
identifiers before signing or store publication. No EAS project, signing identity,
or paid build was created automatically.

For preview/production builds, configure `EXPO_PUBLIC_API_URL` in the EAS build
environment too. The value is embedded in the bundle. Rebuild when changing
native permissions or native modules.

Local builds are also available as `npm run android --workspace mobile` and
`npm run ios --workspace mobile` when Android tooling or full Xcode is installed.
This implementation environment did not have either native toolchain.

## Voice

Choose English or Bangla recognition and Basic or AI understanding. Natural date
parsing, common English/Bangla commands, and recognition alternatives work in
Basic mode. For flexible/mixed phrasing, configure Groq or local Ollama on the
Next.js server using [the voice setup guide](../docs/voice-assistant.md). No AI
secret belongs in the mobile app. AI results are carried into forms as validated
drafts rather than reparsed using the basic grammar.

The voice tab uses the phone’s native speech recognizer via
`expo-speech-recognition`, with native microphone and speech permission prompts.
If denied permanently, **Open microphone settings** opens the app’s system
settings. Availability and offline support depend on the phone and speech service;
audio may be processed online. Typed commands remain available.

Examples:

- `Add expense 500 for groceries`
- `Add expense 250 for lunch in Dining Out yesterday`
- `Borrow 2000 from Rahim`
- `Lend 1000 to Alex`
- `Edit transaction lunch to 300`
- `Edit loan Rahim to 4000`
- `Delete transaction lunch`
- `Delete loan Rahim`

The parser and date helpers live in `shared/` and are reused by the website.
Create/edit commands open editable native review forms. Edit/delete commands
require choosing the target record. Deletion shows a second confirmation.
Loan deletion removes its repayments and activity history. No commands save
automatically, and network failures never automatically retry a mutation.

## API

All responses are JSON with `Cache-Control: no-store`. Authenticated routes
require `Authorization: Bearer <token>`; browser cookies do not authorize them.

| Method | Path under `/api/mobile` | Purpose |
| --- | --- | --- |
| POST | `/login` | Email/password → token, expiry, public user |
| POST | `/logout` | Revoke current mobile session |
| GET | `/bootstrap` | User, categories, accounts, all-time dashboard totals |
| GET | `/transactions?page=1&q=lunch` | Search and paginate, 25 per page |
| GET / PUT / DELETE | `/transactions/:id` | Read/update/delete an owned transaction |
| POST | `/transactions` | Create a transaction |
| GET / POST | `/loans` | List/create loans |
| GET / PUT / DELETE | `/loans/:id` | Read/update/delete an owned loan |
| POST | `/loans/:id/repayments` | Record a repayment |
| POST | `/loans/:id/additions` | Record additional principal |

Payload and response types are in `shared/mobile-api.ts`. Create/update routes
accept full editable records. Repayments/additions accept `{ amount, date,
notes? }`. Dates are real `YYYY-MM-DD` dates; response timestamps are ISO strings.
Amounts use the user’s configured currency. No currency conversion takes place.
Errors use `{ error: string }`, with 400/401/404/413/415/429/500 status codes.

## Verification

```sh
# From repository root:
npm run typecheck --workspace mobile
npm run lint --workspace mobile
npm run export:check --workspace mobile
npx vitest run
npm run test:mobile-api
npm run build
```

`test:mobile-api` creates a uniquely named local test database, deploys the checked-in
migrations there, runs integration tests, then drops that test database. It never
reads the app’s `DATABASE_URL`. If local PostgreSQL requires credentials, set
`MONEXA_TEST_PG_URL` to a local administrative connection string with permission to
create test databases. Remote hosts are rejected.

JavaScript bundle export validates Android/iOS bundling; it is not a signed native
binary or a substitute for testing permission dialogs, speech, and navigation on
actual phones. Production native builds and store publishing are separate steps.

To roll back this feature, remove the mobile app and `/api/mobile` routes from
deployment. The additive session table can remain unused. Existing browser
authentication and transaction/loan tables do not depend on mobile sessions.

## Wallets and cards

Open **Account → Wallets & cards** to add bKash, Nagad, Rocket, Visa debit, or Visa
credit accounts. The native app uses the same account service and optimistic
balance-update checks as the website. These accounts are manual; linked Monexa
transactions update their recorded balances. See [wallet details](../docs/wallets.md).
