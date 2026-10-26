# Wallets and cards

Monexa tracks bKash, Nagad, Rocket, Visa debit, and Visa credit accounts using
its existing Account model. Existing manual accounts remain visible as Other
accounts. No schema migration or new package is required for this feature.

On the website, open **Wallets & cards** from the desktop navigation or the
account menu on phones. In the native app, open **Account → Wallets & cards**.
Enter a name, optional last four digits, and a starting/current recorded balance.
For Visa, the name can identify the issuing bank and card nickname.

## What updates automatically

Transactions linked through the existing **Account** field adjust the recorded
account balance. Creating, editing, moving, or deleting a transaction applies or
reverses its balance effect through the existing transactional service. Accounts
appear in transaction forms on web and mobile.

Credit card amounts owed are stored as negative ledger balances. An expense
increases debt; a credit reduces it. In the wallet editor, a positive **Amount
owed** represents debt; a negative amount represents a positive card credit.
The interface labels debt and positive credit balances separately. This is a
recorded balance, not an issuer-provided credit limit or available-credit figure.

A manual balance correction updates the account snapshot; it does not create an
income/expense transaction. The update checks both the last-change timestamp and
previous balance, so an intervening transaction cannot be overwritten by a stale
editor. Conflicts retain the draft and offer an explicit discard/reload action.

Wallet opening balances and corrections are separate from dashboard income and
expense totals. The dashboard labels its existing ledger calculation **Cash flow
balance**; the Wallets page summarizes recorded wallet/debit balances and card
debt separately. The app does not infer whether a card and another manually added
account represent the same underlying funds. Internal transfers and card payments
are not imported or classified automatically by this feature.

Only a masked four-digit ending is accepted by the new wallet API. It never
requests a full card number, PIN, OTP, CVV, expiry date, or banking password.

## Live synchronization remains unavailable

Every account is explicitly labeled **Manual**. The feature makes no external
requests to bKash, Nagad, Rocket, or Visa. “Changed” timestamps describe changes
inside Monexa, not a bank synchronization or verification event.

Public payment integration documentation is not proof of permission to read an
individual's personal wallet or bank balance. A production connection requires a
provider-approved account-data integration, its credentials and user authorization,
and institution coverage. Visa is the card network; the issuing bank and specific
card program determine the appropriate integration. No issuer has been selected
for the Visa integration yet.

Official references:

- [bKash payment integration documentation](https://developer.bka.sh/)
- [Nagad](https://nagad.com.bd/)
- [Dutch-Bangla Bank Rocket](https://www.dutchbanglabank.com/rocket/rocket.html)
- [Visa issuer/account information](https://www.visa.co.uk/partner-with-us/developer/general-services.html)

No provider tokens are collected or stored, and no live-sync adapter, background
sync job, webhook, statement importer, or automatic SMS access is implemented.
Future synchronization must reconcile imported transactions and balance snapshots
without counting the same movement twice.
