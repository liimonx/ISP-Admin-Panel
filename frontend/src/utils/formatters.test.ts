import { describe, it, expect } from 'vitest';
import { getInitials, truncateText } from './formatters';

describe('truncateText', () => {
  it('should return the original string if it is shorter than maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('should return the original string if its length is exactly maxLength', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('should truncate the string and append "..." if it is longer than maxLength', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
    expect(truncateText('A very long string that needs truncation', 10)).toBe('A very lon...');
  });

  it('should handle empty strings correctly', () => {
    expect(truncateText('', 5)).toBe('');
    expect(truncateText('', 0)).toBe('');
  });

  it('should handle zero maxLength by returning "..." for non-empty strings', () => {
    expect(truncateText('Hello', 0)).toBe('...');
  });

  it('should handle negative maxLength', () => {
    // text.length > -1 is true for 'Hello'
    // 'Hello'.slice(0, -1) -> 'Hell' + '...'
    expect(truncateText('Hello', -1)).toBe('Hell...');
    expect(truncateText('Hello', -10)).toBe('...');
  });
});

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
