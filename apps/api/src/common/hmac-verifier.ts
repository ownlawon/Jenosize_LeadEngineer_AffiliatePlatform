import * as crypto from "crypto";

/**
 * Constant-time HMAC-SHA256 verification used by the webhook receiver.
 * Returns `false` on any error (length mismatch, invalid hex, missing
 * input) so the caller can treat "not verified" uniformly without
 * branching on exception types.
 */
export function verifyHmac(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!payload || !signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
