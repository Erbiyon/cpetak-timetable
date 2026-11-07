import crypto from "crypto";

export interface HashOptions {
  N?: number;
  r?: number;
  p?: number;
  keyLen?: number;
}

const DEFAULT_OPTIONS: Required<HashOptions> = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64,
};

/**
 * Derives a cryptographic password hash using Node.js built-in scrypt KDF.
 * Format: scrypt$<N>$<r>$<p>$<salt_hex>$<derived_key_hex>
 */
export function hashPassword(password: string, options?: HashOptions): string {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  const N = options?.N || DEFAULT_OPTIONS.N;
  const r = options?.r || DEFAULT_OPTIONS.r;
  const p = options?.p || DEFAULT_OPTIONS.p;
  const keyLen = options?.keyLen || DEFAULT_OPTIONS.keyLen;

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, keyLen, { N, r, p });

  return ["scrypt", N.toString(), r.toString(), p.toString(), salt, derivedKey.toString("hex")].join(
    "$"
  );
}

/**
 * Verifies a candidate password against an scrypt formatted hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, NStr, rStr, pStr, salt, hashHex] = parts;
  const N = parseInt(NStr, 10);
  const r = parseInt(rStr, 10);
  const p = parseInt(pStr, 10);

  if (isNaN(N) || isNaN(r) || isNaN(p) || !salt || !hashHex) {
    return false;
  }

  try {
    const expectedHashBuf = Buffer.from(hashHex, "hex");
    const derivedKey = crypto.scryptSync(password, salt, expectedHashBuf.length, { N, r, p });

    if (derivedKey.length !== expectedHashBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedHashBuf);
  } catch (error) {
    console.error("Crypto verification error:", error);
    return false;
  }
}

/**
 * Hashes a one-time token using SHA-256 for secure lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random token.
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

