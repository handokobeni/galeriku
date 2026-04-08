const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const TITLE_MAX = 80;

export function kebabify(title: string): string {
  const cleaned = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "album";
}

function randomPrefix(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

export function generateSlug(title: string): string {
  const kebab = kebabify(title).slice(0, TITLE_MAX).replace(/-+$/, "");
  return `${randomPrefix()}-${kebab || "album"}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]{5}-[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
