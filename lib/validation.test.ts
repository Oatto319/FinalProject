import { describe, it, expect } from 'vitest';
import { isValidPassword } from './validation';

describe('isValidPassword', () => {
  it('accepts a password with 8+ chars, at least one letter and one digit', () => {
    expect(isValidPassword('abcdef12')).toBe(true);
  });

  it.each([
    ['short but valid mix', 'abc123'],       // < 8 chars
    ['letters only', 'abcdefgh'],
    ['digits only', '12345678'],
    ['empty string', ''],
  ])('rejects %s', (_label, pw) => {
    expect(isValidPassword(pw)).toBe(false);
  });

  it('accepts exactly 8 characters at the boundary', () => {
    expect(isValidPassword('a1234567')).toBe(true);
  });

  it('rejects 7 characters even with letters and digits', () => {
    expect(isValidPassword('a123456')).toBe(false);
  });
});
