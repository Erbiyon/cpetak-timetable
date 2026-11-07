import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
} from "@/lib/password";

describe("Password and Token Cryptographic Engine (lib/password.ts)", () => {
  it("generates a valid scrypt hash with correct format", () => {
    const rawPass = "MySecurePassword#2026";
    const hash = hashPassword(rawPass);

    expect(typeof hash).toBe("string");
    const parts = hash.split("$");
    expect(parts.length).toBe(6);
    expect(parts[0]).toBe("scrypt");
    expect(parts[1]).toBe("16384");
    expect(parts[2]).toBe("8");
    expect(parts[3]).toBe("5");
    expect(parts[4].length).toBe(32); // 16 bytes hex
    expect(parts[5].length).toBe(128); // 64 bytes hex
  });

  it("successfully verifies valid candidate password", () => {
    const rawPass = "SecretTeacherPassword@99";
    const hash = hashPassword(rawPass);

    const isValid = verifyPassword(rawPass, hash);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect candidate password", () => {
    const rawPass = "SecretTeacherPassword@99";
    const hash = hashPassword(rawPass);

    const isValid = verifyPassword("WrongPassword123", hash);
    expect(isValid).toBe(false);
  });

  it("fails closed on null, undefined, empty, or malformed hashes", () => {
    expect(verifyPassword("pass", null as any)).toBe(false);
    expect(verifyPassword("pass", undefined as any)).toBe(false);
    expect(verifyPassword("pass", "")).toBe(false);
    expect(verifyPassword("pass", "plain-text-password")).toBe(false);
    expect(verifyPassword("pass", "scrypt$invalid$format")).toBe(false);
    expect(verifyPassword("", "scrypt$16384$8$1$salt$hash")).toBe(false);
  });

  it("produces unique hashes for the same password due to random salt", () => {
    const pass = "IdenticalPassword!";
    const hash1 = hashPassword(pass);
    const hash2 = hashPassword(pass);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(pass, hash1)).toBe(true);
    expect(verifyPassword(pass, hash2)).toBe(true);
  });

  it("generates and hashes single-use tokens securely", () => {
    const rawToken = generateSecureToken(32);
    expect(rawToken.length).toBe(64); // 32 bytes hex

    const hashedToken = hashToken(rawToken);
    expect(hashedToken.length).toBe(64); // sha256 hex
    expect(hashedToken).not.toBe(rawToken);

    // Deterministic hashing of identical token
    expect(hashToken(rawToken)).toBe(hashedToken);
  });
});

