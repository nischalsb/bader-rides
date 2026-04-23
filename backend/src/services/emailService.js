import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "BadgerPool <onboarding@resend.dev>";
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

// Lazy-init: avoids crashing boot when RESEND_API_KEY isn't set yet.
let client = null;
function getClient() {
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export async function sendPasswordResetEmail(email, rawToken) {
  const resend = getClient();
  const url = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

  if (!resend) {
    // Dev fallback: log the link so local testing works without a real API key.
    console.log(`[email] RESEND_API_KEY not set — reset link for ${email}: ${url}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your BadgerPool password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p style="color:#444">Click the button below to set a new password. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#c5050c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Reset password
          </a>
        </p>
        <p style="color:#666;font-size:13px">Or paste this link into your browser:<br><span style="word-break:break-all">${url}</span></p>
        <p style="color:#666;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message || "unknown"}`);
  }
}
