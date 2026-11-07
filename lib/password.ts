import crypto from "crypto";

const scryptAsync = (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
};

export interface HashOptions {
  N?: number;
  r?: number;
  p?: number;
  keyLen?: number;
  maxmem?: number;
}

const DEFAULT_OPTIONS: Required<HashOptions> = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64,
  maxmem: 32 * 1024 * 1024, // 32MB safety boundary for OWASP scrypt cost
};

/**
 * Validates password complexity against policy:
 * - Length: 8 - 128 characters
 * - Not identical to public user identifier
 */
export function validatePasswordPolicy(password: string, identifier?: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "รหัสผ่านต้องเป็นข้อความที่ไม่ว่างเปล่า" };
  }
  if (password.length < 8) {
    return { valid: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
  }
  if (password.length > 128) {
    return { valid: false, error: "รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร" };
  }
  if (identifier && password.trim().toLowerCase() === identifier.trim().toLowerCase()) {
    return { valid: false, error: "ไม่อนุญาตให้ใช้รหัสประจำตัวเป็นรหัสผ่านเพื่อความปลอดภัย" };
  }
  return { valid: true };
}

/**
 * Asynchronously derives a cryptographic password hash using Node.js built-in scrypt KDF.
 * Non-blocking for the Node.js event loop during high-concurrency requests.
 * Format: scrypt$<N>$<r>$<p>$<salt_hex>$<derived_key_hex>
 */
export async function hashPasswordAsync(password: string, options?: HashOptions): Promise<string> {
  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    throw new Error(policy.error);
  }

  const N = options?.N || DEFAULT_OPTIONS.N;
  const r = options?.r || DEFAULT_OPTIONS.r;
  const p = options?.p || DEFAULT_OPTIONS.p;
  const keyLen = options?.keyLen || DEFAULT_OPTIONS.keyLen;
  const maxmem = options?.maxmem || DEFAULT_OPTIONS.maxmem;

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, keyLen, { N, r, p, maxmem })) as Buffer;

  return ["scrypt", N.toString(), r.toString(), p.toString(), salt, derivedKey.toString("hex")].join("$");
}

/**
 * Synchronous variant preserved for compatibility and test assertions.
 */
export function hashPassword(password: string, options?: HashOptions): string {
  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    throw new Error(policy.error);
  }

  const N = options?.N || DEFAULT_OPTIONS.N;
  const r = options?.r || DEFAULT_OPTIONS.r;
  const p = options?.p || DEFAULT_OPTIONS.p;
  const keyLen = options?.keyLen || DEFAULT_OPTIONS.keyLen;
  const maxmem = options?.maxmem || DEFAULT_OPTIONS.maxmem;

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, keyLen, { N, r, p, maxmem });

  return ["scrypt", N.toString(), r.toString(), p.toString(), salt, derivedKey.toString("hex")].join("$");
}

/**
 * Asynchronously verifies a candidate password against an scrypt formatted hash using timingSafeEqual.
 */
export async function verifyPasswordAsync(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  if (password.length > 128) {
    return false; // Prevent DoS with excessively long candidate passwords
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
    const derivedKey = (await scryptAsync(password, salt, expectedHashBuf.length, {
      N,
      r,
      p,
      maxmem: DEFAULT_OPTIONS.maxmem,
    })) as Buffer;

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
 * Synchronous verification variant preserved for existing synchronous contexts.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  if (password.length > 128) {
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
    const derivedKey = crypto.scryptSync(password, salt, expectedHashBuf.length, {
      N,
      r,
      p,
      maxmem: DEFAULT_OPTIONS.maxmem,
    });

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

