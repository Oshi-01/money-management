// Sends a sample password-reset email to check the email setup end to end.
// Usage: npm run email:test -- you@example.com

import { passwordResetEmail, sendEmail } from "../lib/email.ts";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
  console.error("RESEND_API_KEY and EMAIL_FROM must be set in .env first.");
  process.exit(1);
}

const sent = await sendEmail({
  to,
  ...passwordResetEmail({ name: "there", link: "http://localhost:3000/reset-password?token=test" }),
});

if (sent) {
  console.log(`Sent. Check the inbox (and spam folder) of ${to}.`);
} else {
  console.error(
    "Not sent - see the error above. Using onboarding@resend.dev? It can only send to the email you signed up to Resend with.",
  );
  process.exit(1);
}
