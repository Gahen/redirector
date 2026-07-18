import { randomBytes } from "crypto";

// URL-safe base64 charset (no + / =)
const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const CODE_LENGTH = 5;

// 8 bits of randomness per byte; we use 64 bytes for a generous pool and
// reject-re-sample to avoid modulo bias on the 64-char charset.
function pickChar(buf: Buffer, idx: number): string {
  return CHARSET[buf[idx] % CHARSET.length];
}

export function generateCode(): string {
  const buf = randomBytes(CODE_LENGTH * 4);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += pickChar(buf, i);
  }
  return out;
}

// Singleton test seam — exported only so tests can, if added, inject.
export const __INTERNAL__ = { charset: CHARSET, length: CODE_LENGTH };
