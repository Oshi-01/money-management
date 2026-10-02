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
      // Log the status and error type only - the message can echo the recipient's address.
      const body = (await response.json().catch(() => null)) as { name?: string } | null;
      console.error(`Email provider rejected the message (HTTP ${response.status}${body?.name ? `, ${body.name}` : ""}).`);
      if (response.status === 403 && /@resend\.dev>?\s*$/i.test(from)) {
        console.error(
          "EMAIL_FROM is Resend's test sender, which only delivers to the email you signed up to Resend with. " +
            "Verify a domain at https://resend.com/domains to email other addresses.",
        );
      }
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

/** Shared look for all emails: a white card on the app's green background. `bodyHtml` must already be escaped. */
function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#eef7f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px">
    <tr><td>
      <p style="margin:0 0 24px;font-size:18px;font-weight:bold;color:#059669">Monexa</p>
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </td></tr>
  </table>
  <p style="max-width:480px;margin:16px auto 0;text-align:center;font-size:12px;color:#94a3b8">You're receiving this because of activity on your Monexa account.</p>
</body></html>`;
}

const paragraph = (html: string, muted = false) =>
  `<p style="margin:0 0 16px;line-height:1.5${muted ? ";font-size:13px;color:#64748b" : ""}">${html}</p>`;

const greetingFor = (name?: string | null) => ({
  text: name ? `Hi ${name},` : "Hi,",
  html: name ? `Hi ${escapeHtml(name)},` : "Hi,",
});

export function passwordResetEmail({ name, link }: { name?: string | null; link: string }): Omit<EmailMessage, "to"> {
  const greeting = greetingFor(name);
  const safeLink = escapeHtml(link);

  return {
    subject: "Reset your Monexa password",
    text: [
      greeting.text,
      "",
      "We received a request to reset your Monexa password. Open this link to choose a new one (it works for 1 hour):",
      link,
      "",
      "If you didn't ask for this, you can ignore this email - your password won't change.",
    ].join("\n"),
    html: layout(
      "Reset your password",
      [
        paragraph(greeting.html),
        paragraph("We received a request to reset your Monexa password. The link below works for 1 hour."),
        `<p style="margin:8px 0 24px"><a href="${safeLink}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:999px">Choose a new password</a></p>`,
        paragraph(`If the button doesn't work, paste this link into your browser:<br>${safeLink}`, true),
        paragraph("If you didn't ask for this, you can ignore this email - your password won't change.", true),
      ].join("\n"),
    ),
  };
}

export function passwordChangedEmail({ name, loginUrl }: { name?: string | null; loginUrl: string }): Omit<EmailMessage, "to"> {
  const greeting = greetingFor(name);
  const safeUrl = escapeHtml(loginUrl);

  return {
    subject: "Your Monexa password was changed",
    text: [
      greeting.text,
      "",
      "The password for your Monexa account was just changed, and every device that was signed in has been signed out.",
      "",
      `If this was you, there's nothing else to do. You can sign in here: ${loginUrl}`,
      "",
      "If you did NOT change it, someone may have access to your email. Secure your email account first, then reset your Monexa password from the sign-in page.",
    ].join("\n"),
    html: layout(
      "Your password was changed",
      [
        paragraph(greeting.html),
        paragraph("The password for your Monexa account was just changed, and every device that was signed in has been signed out."),
        paragraph(`If this was you, there's nothing else to do. <a href="${safeUrl}" style="color:#059669;font-weight:bold">Sign in to Monexa</a>`),
        paragraph("<strong>Didn't do this?</strong> Someone may have access to your email. Secure your email account first, then reset your Monexa password from the sign-in page.", true),
      ].join("\n"),
    ),
  };
}
