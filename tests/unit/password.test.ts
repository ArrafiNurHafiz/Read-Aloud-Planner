import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, hashPassword, verifyPassword } from '../../src/services/password.js';

describe('Password Security Service', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const check = validatePasswordStrength('Short123!');
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('12');
  });

  it('rejects common breached passwords', () => {
    const check = validatePasswordStrength('password123456');
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('bocor');
  });

  it('accepts valid long passphrase', () => {
    const check = validatePasswordStrength('kucing-berlari-di-atas-meja-2026');
    expect(check.valid).toBe(true);
  });

  it('hashes and verifies password matching', async () => {
    const pw = 'kucing-berlari-di-atas-meja-2026';
    const hash = await hashPassword(pw);
    expect(hash).not.toBe(pw);
    const isValid = await verifyPassword(pw, hash);
    expect(isValid).toBe(true);
    const isInvalid = await verifyPassword('wrongpassword123', hash);
    expect(isInvalid).toBe(false);
  });
});
