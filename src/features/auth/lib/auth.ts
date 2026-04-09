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
    // In-memory storage. We previously tried `storage: "database"` but it
    // requires the Better Auth `rateLimit` table to exist in the Drizzle
    // schema and ours doesn't have it (we don't import Better Auth's
    // generated schema directly). Memory works for single-instance deploys
    // and we already have the edge limiter in proxy.ts as the primary
    // control — Better Auth's built-in is defense in depth.
    // TODO: when scaling to multi-region, generate the rateLimit table
    // via @better-auth/cli + add to drizzle schema, then re-enable database.
    // Default fallback for any auth endpoint not explicitly listed below
    window: 60,
    max: 30,
    customRules: {
      // Login: aligned with the loginLimiter at the edge (10 / 5 minutes).
      // Better Auth provides defense in depth here; the edge limiter is the
      // primary control.
      "/sign-in/email": { window: 5 * 60, max: 10 },
      // Sign-up: 5 per 10 minutes per IP. Stops automated account creation.
      "/sign-up/email": { window: 10 * 60, max: 5 },
      // Password reset request via Better Auth's actual endpoint name.
      // (The /forget-password path that earlier docs suggested does not
      // exist in better-auth — verified in node_modules/better-auth source.)
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
