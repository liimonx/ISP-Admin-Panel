import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatters';

describe('formatDuration', () => {
  it('should format seconds less than a minute correctly', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(10)).toBe('10s');
    expect(formatDuration(0)).toBe('0s');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(125)).toBe('2m 5s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('should format hours correctly', () => {
    expect(formatDuration(3600)).toBe('1h 0m 0s');
    expect(formatDuration(3665)).toBe('1h 1m 5s');
    expect(formatDuration(7322)).toBe('2h 2m 2s');
  });

  it('should format fractional seconds as integers', () => {
    expect(formatDuration(1.5)).toBe('1s');
    expect(formatDuration(61.5)).toBe('1m 1s');
  });
});
