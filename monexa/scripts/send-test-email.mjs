// Sends a sample password-reset email to check the email setup end to end.
// Usage: npm run email:test -- you@example.com

import { passwordResetEmail, sendEmail } from "../lib/email.ts";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}

const { SMTP_HOST, SMTP_USER, SMTP_PASS, RESEND_API_KEY, EMAIL_FROM } = process.env;
const usingSmtp = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
if (!usingSmtp && !(RESEND_API_KEY && EMAIL_FROM)) {
  console.error("Set SMTP_HOST, SMTP_USER and SMTP_PASS (or RESEND_API_KEY and EMAIL_FROM) in .env first.");
  process.exit(1);
}
console.log(`Sending via ${usingSmtp ? `SMTP (${SMTP_HOST})` : "Resend"}...`);

const sent = await sendEmail({
  to,
  ...passwordResetEmail({ name: "there", link: "http://localhost:3000/reset-password?token=test" }),
});

if (sent) {
  console.log(`Sent. Check the inbox (and spam folder) of ${to}.`);
} else {
  console.error("Not sent - see the error above.");
  process.exit(1);
}
