import { verify } from "@node-rs/argon2";
import { getAlbumBySlug } from "./get-album-by-slug";
import { signCookie } from "../lib/cookies";
import { unlockLimiter } from "../lib/rate-limit";

export type UnlockResult =
  | { ok: true; token: string; albumId: string }
  | { ok: false; reason: "not-found" | "wrong-password" | "rate-limited" };

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export async function unlockAlbum(input: {
  slug: string;
  password: string;
  clientKey: string;
}): Promise<UnlockResult> {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) throw new Error("GUEST_COOKIE_SECRET not configured");

  // Resolve album FIRST so non-existent slugs always return not-found and
  // never leak rate-limit state to attackers spraying random slugs.
  const result = await getAlbumBySlug(input.slug);
  if (!result || !result.album.isPublic) {
    return { ok: false, reason: "not-found" };
  }

  const rateKey = `unlock:${input.clientKey}:${input.slug}`;
  // Check (without incrementing) — only count failed attempts below.
  if (!unlockLimiter.isAllowed(rateKey)) {
    return { ok: false, reason: "rate-limited" };
  }

  if (result.album.passwordHash) {
    const ok = await verify(result.album.passwordHash, input.password);
    if (!ok) {
      // Count this failed attempt
      unlockLimiter.hit(rateKey);
      return { ok: false, reason: "wrong-password" };
    }
  }

  // Successful unlock — clear the failure bucket so legit retries don't accumulate
  unlockLimiter.reset(rateKey);

  const token = await signCookie(
    { albumId: result.album.id, exp: Date.now() + TWENTY_FOUR_HOURS },
    secret,
  );
  return { ok: true, token, albumId: result.album.id };
}
