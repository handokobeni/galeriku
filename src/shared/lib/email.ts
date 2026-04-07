import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const result = await resend.emails.send({
    from: `Galeriku <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  if (result.error) {
    console.error("[email] Failed to send:", result.error);
    throw new Error("Failed to send email");
  }

  return result.data;
}

export function buildResetPasswordEmail(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Reset your password</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #52525b;">Hi ${name},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #52525b;">
          You requested to reset your password for your Galeriku account.
          Click the button below to set a new password. This link will expire in 1 hour.
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #71717a; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="font-size: 12px; color: #71717a; line-height: 1.6; margin-top: 24px;">
          Or copy this link: <br />
          <span style="color: #6366f1; word-break: break-all;">${resetUrl}</span>
        </p>
      </body>
    </html>
  `;
}
