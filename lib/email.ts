import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL ?? "GameShelf <noreply@gameshelf.app>";
const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${baseUrl}/verify-email?token=${token}`;
  await resend.emails.send({
    from,
    to: email,
    subject: "Verify your GameShelf email",
    html: emailHtml({
      heading: "Verify your email",
      body: "Thanks for signing up! Click the button below to verify your email address. This link expires in 24 hours.",
      buttonText: "Verify Email",
      buttonHref: link,
      footerNote: "If you didn't create a GameShelf account, you can safely ignore this email.",
    }),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${baseUrl}/reset-password?token=${token}`;
  await resend.emails.send({
    from,
    to: email,
    subject: "Reset your GameShelf password",
    html: emailHtml({
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.",
      buttonText: "Reset Password",
      buttonHref: link,
      footerNote: "If you didn't request a password reset, you can safely ignore this email.",
    }),
  });
}

export async function sendGoogleAccountEmail(email: string) {
  await resend.emails.send({
    from,
    to: email,
    subject: "Sign in to GameShelf",
    html: emailHtml({
      heading: "Your account uses Google sign-in",
      body: "Your GameShelf account is linked to Google. You don't need a password — just click \"Continue with Google\" on the sign-in page.",
      buttonText: "Sign In",
      buttonHref: `${baseUrl}/login`,
      footerNote: "If you didn't request this email, you can safely ignore it.",
    }),
  });
}

function emailHtml({
  heading,
  body,
  buttonText,
  buttonHref,
  footerNote,
}: {
  heading: string;
  body: string;
  buttonText: string;
  buttonHref: string;
  footerNote: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:700;color:#e2e5eb;letter-spacing:-0.5px;">GameShelf</span>
        </td></tr>
        <tr><td style="background-color:#161b26;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e2e5eb;">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#8b92a5;">${body}</p>
          <a href="${buttonHref}" style="display:inline-block;background-color:#e5a837;color:#0f1117;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">${buttonText}</a>
          <p style="margin:28px 0 0;font-size:13px;color:#555d72;">Or copy this link:<br><span style="color:#8b92a5;word-break:break-all;">${buttonHref}</span></p>
        </td></tr>
        <tr><td style="padding-top:20px;">
          <p style="margin:0;font-size:12px;color:#555d72;text-align:center;">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
