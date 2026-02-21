import { describe, it, expect } from 'vitest';
import { getInitials } from './formatters';

describe('getInitials', () => {
  it('should return initials for valid first and last names', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
    expect(getInitials('Jane', 'Smith')).toBe('JS');
  });

  it('should handle empty strings gracefully', () => {
    expect(getInitials('', '')).toBe('');
    expect(getInitials('John', '')).toBe('J');
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('should handle single names correctly', () => {
    expect(getInitials('John', '')).toBe('J');
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('should handle null or undefined inputs (ignoring strict types)', () => {
    // We cast to any to simulate runtime behavior where types might not be enforced
    expect(getInitials(null as any, null as any)).toBe('');
    expect(getInitials(undefined as any, undefined as any)).toBe('');
    expect(getInitials('John', null as any)).toBe('J');
    expect(getInitials(undefined as any, 'Doe')).toBe('D');
  });

  it('should handle names with leading spaces', () => {
    // Current implementation does not trim, so " John" results in " "
    expect(getInitials(' John', 'Doe')).toBe(' D');
    expect(getInitials('John', ' Doe')).toBe('J ');
  });

  it('should handle special characters', () => {
    expect(getInitials('J@ne', 'D!oe')).toBe('JD');
    expect(getInitials('@lice', '#bob')).toBe('@#');
  });

  it('should be case insensitive regarding output (always uppercase)', () => {
    expect(getInitials('john', 'doe')).toBe('JD');
    expect(getInitials('jOhN', 'dOe')).toBe('JD');
  });
});
