// HMAC-SHA256 signed cookie payloads. Stateless. Used for guest unlock & guest id.
// Format: base64url(payload).base64url(signature)

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signCookie<T extends object>(payload: T, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const payloadB64 = b64url(enc.encode(json));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return `${payloadB64}.${b64url(sig)}`;
}

export async function verifyCookie<T = unknown>(token: string, secret: string): Promise<T | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await hmacKey(secret);
    const expected = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    if (!constantTimeEqual(new Uint8Array(expected), b64urlDecode(sigB64))) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp < Date.now()) return null;
    return payload as T;
  } catch {
    return null;
  }
}
