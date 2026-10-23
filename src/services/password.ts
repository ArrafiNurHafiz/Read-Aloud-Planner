import bcrypt from 'bcryptjs';

const COMMON_PASSWORDS = new Set([
  'password123456',
  '123456789012',
  'qwertyuiop12',
  'admin12345678',
  'indonesia12345'
]);

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 12) {
    return { valid: false, reason: 'Kata sandi minimal 12 karakter.' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, reason: 'Kata sandi terdeteksi dalam daftar bocor/terlalu umum.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
