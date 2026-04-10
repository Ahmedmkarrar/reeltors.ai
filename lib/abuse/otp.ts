import { randomInt, createHash } from 'crypto';

export function generateOtp(): string {
  // randomInt(min, max) is exclusive of max, so 100000–999999 gives exactly 6 digits
  return String(randomInt(100000, 1000000));
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}
