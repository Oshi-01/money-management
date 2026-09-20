/**
 * Sends email through Resend (https://resend.com) using its HTTP API - no SDK
 * needed. Configure with RESEND_API_KEY and EMAIL_FROM
 * (e.g. 'Monexa <no-reply@your-domain.com>').
 *
 * Without a key, emails are printed to the console in development only. In
 * production they are NOT logged (a reset link is an account-takeover token)
 * and the send simply fails, which callers must handle.
 *
 * To use another provider (SendGrid, Postmark, SES...) replace the body of
 * sendEmail() - nothing else in the app depends on Resend.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n=======================================");
      console.log(`EMAIL (development only - no RESEND_API_KEY set)`);
      console.log(`To:      ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(message.text);
      console.log("=======================================\n");
      return true;
    }
    console.error("Email not sent: RESEND_API_KEY / EMAIL_FROM are not configured.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Log the status only - the response can echo the recipient's address.
      console.error(`Email provider rejected the message (HTTP ${response.status}).`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email could not be sent:", error instanceof Error ? error.message : error);
    return false;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function passwordResetEmail({ name, link }: { name?: string | null; link: string }): Omit<EmailMessage, "to"> {
  const greeting = name ? `Hi ${name},` : "Hi,";
  const safeGreeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const safeLink = escapeHtml(link);

  return {
    subject: "Reset your Monexa password",
    text: [
      greeting,
      "",
      "We received a request to reset your Monexa password. Open this link to choose a new one (it works for 1 hour):",
      link,
      "",
      "If you didn't ask for this, you can ignore this email - your password won't change.",
    ].join("\n"),
    html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#eef7f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px">
    <tr><td>
      <h1 style="margin:0 0 16px;font-size:20px">Reset your password</h1>
      <p style="margin:0 0 12px;line-height:1.5">${safeGreeting}</p>
      <p style="margin:0 0 24px;line-height:1.5">We received a request to reset your Monexa password. The link below works for 1 hour.</p>
      <p style="margin:0 0 24px"><a href="${safeLink}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px">Choose a new password</a></p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">If the button doesn't work, paste this link into your browser:<br>${safeLink}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.5">If you didn't ask for this, you can ignore this email - your password won't change.</p>
    </td></tr>
  </table>
</body></html>`,
  };
}
