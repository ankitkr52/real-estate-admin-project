import { Resend } from "resend";

let client: Resend | null = null;
function resend() {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY missing");
    client = new Resend(key);
  }
  return client;
}

function from() {
  const f = process.env.EMAIL_FROM;
  if (!f) throw new Error("EMAIL_FROM missing");
  return f;
}

function appUrl() {
  const u = process.env.NEXT_PUBLIC_APP_URL;
  if (!u) throw new Error("NEXT_PUBLIC_APP_URL missing");
  return u.replace(/\/$/, "");
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return resend().emails.send({
    from: from(),
    to,
    subject: "Verify your Real Estate Portal email",
    text: `Welcome. Verify your email by opening this link (valid for 24 hours): ${url}`,
    html: `<p>Welcome.</p><p>Verify your email by opening <a href="${url}">this link</a>. It is valid for 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return resend().emails.send({
    from: from(),
    to,
    subject: "Reset your Real Estate Portal password",
    text: `Reset your password with this link (valid for 1 hour): ${url}. If you did not request this, you can ignore this email.`,
    html: `<p>Reset your password by opening <a href="${url}">this link</a>. It is valid for 1 hour.</p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}
