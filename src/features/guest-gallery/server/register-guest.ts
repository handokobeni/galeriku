import { db } from "@/db";
import { galleryGuests } from "@/db/schema";
import { signCookie } from "../lib/cookies";
import { guestRegisterLimiter } from "../lib/rate-limit";

export type RegisterResult =
  | { ok: true; token: string; guestId: string }
  | { ok: false; reason: "invalid-name" | "rate-limited" };

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const MAX_NAME = 60;

export async function registerGuest(input: {
  albumId: string;
  name: string;
  clientKey: string;
}): Promise<RegisterResult> {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) throw new Error("GUEST_COOKIE_SECRET not configured");

  // Validate FIRST so empty/invalid submissions don't consume the rate-limit
  // budget. Only count semantically-valid attempts.
  const trimmed = input.name.trim().slice(0, MAX_NAME);
  if (trimmed.length === 0) return { ok: false, reason: "invalid-name" };

  if (!guestRegisterLimiter.check(`guest:${input.clientKey}:${input.albumId}`)) {
    return { ok: false, reason: "rate-limited" };
  }

  const [g] = await db
    .insert(galleryGuests)
    .values({ albumId: input.albumId, displayName: trimmed })
    .returning();

  const token = await signCookie(
    { guestId: g.id, albumId: input.albumId, exp: Date.now() + THIRTY_DAYS },
    secret,
  );
  return { ok: true, token, guestId: g.id };
}
