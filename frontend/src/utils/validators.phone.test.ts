import { describe, it, expect } from 'vitest';
import { isValidPhone } from './validators';

describe('isValidPhone', () => {
  // Valid cases
  it('should return true for valid phone numbers without spaces', () => {
    expect(isValidPhone('1234567890')).toBe(true);
    expect(isValidPhone('987654321')).toBe(true);
  });

  it('should return true for valid phone numbers with leading +', () => {
    expect(isValidPhone('+1234567890')).toBe(true);
    expect(isValidPhone('+987654321')).toBe(true);
  });

  it('should return true for valid phone numbers with spaces', () => {
    expect(isValidPhone('123 456 7890')).toBe(true);
    expect(isValidPhone('+1 234 567 890')).toBe(true);
    expect(isValidPhone('1 2 3 4 5 6 7 8 9 0')).toBe(true);
  });

  it('should return true for the minimum valid length (1 digit)', () => {
    // Current regex allows 1 digit [1-9] followed by 0 digits
    expect(isValidPhone('1')).toBe(true);
    expect(isValidPhone('+1')).toBe(true);
  });

  it('should return true for the maximum valid length (16 digits)', () => {
    // Current regex allows 1 digit [1-9] followed by up to 15 digits
    const maxDigits = '1234567890123456'; // 16 digits
    expect(isValidPhone(maxDigits)).toBe(true);
    expect(isValidPhone(`+${maxDigits}`)).toBe(true);
  });

  // Invalid cases
  it('should return false for empty or whitespace-only strings', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('   ')).toBe(false);
  });

  it('should return false for phone numbers starting with 0', () => {
    // Regex requires first digit to be [1-9]
    expect(isValidPhone('0123456789')).toBe(false);
    expect(isValidPhone('+0123456789')).toBe(false);
    expect(isValidPhone(' 0123456789')).toBe(false);
  });

  it('should return false for phone numbers with non-numeric characters other than spaces and leading +', () => {
    expect(isValidPhone('123-456-7890')).toBe(false); // Dashes not allowed/stripped
    expect(isValidPhone('(123) 456-7890')).toBe(false); // Parentheses not allowed
    expect(isValidPhone('123.456.7890')).toBe(false); // Dots not allowed
    expect(isValidPhone('123abc456')).toBe(false); // Letters not allowed
  });

  it('should return false for phone numbers exceeding maximum length (17 digits)', () => {
    const tooLong = '12345678901234567'; // 17 digits
    expect(isValidPhone(tooLong)).toBe(false);
    expect(isValidPhone(`+${tooLong}`)).toBe(false);
  });

  it('should return false for invalid + placement', () => {
    expect(isValidPhone('1+234567890')).toBe(false);
    expect(isValidPhone('1234567890+')).toBe(false);
  });
});
