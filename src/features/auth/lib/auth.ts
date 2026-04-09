import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hash, verify, type Options } from "@node-rs/argon2";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail, buildResetPasswordEmail } from "@/shared/lib/email";

const argon2Opts: Options = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
  algorithm: 2, // Argon2id
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: (password) => hash(password, argon2Opts),
      verify: ({ password, hash: storedHash }) => verify(storedHash, password, argon2Opts),
    },
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Galeriku password",
          html: buildResetPasswordEmail(user.name, url),
        });
      } catch (err) {
        console.error("[auth] Failed to send reset email:", err);
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  rateLimit: {
    enabled: true,
    // Default fallback for any auth endpoint not explicitly listed below
    window: 60,
    max: 30,
    customRules: {
      // Login: 10 attempts per minute per IP. Brute force protection without
      // blocking legit users who fat-fingered their password a few times.
      "/sign-in/email": { window: 60, max: 10 },
      // Sign-up: 5 per 10 minutes per IP. Stops automated account creation.
      "/sign-up/email": { window: 10 * 60, max: 5 },
      // Password reset request via Better Auth's own endpoint (in case it's
      // hit directly instead of through our checkEmailAndRequestReset action,
      // which has its own limiter). 3 / 15min per IP.
      "/forget-password": { window: 15 * 60, max: 3 },
      "/request-password-reset": { window: 15 * 60, max: 3 },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      role: {
        type: ["owner", "member"],
        required: false,
        defaultValue: "member",
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
