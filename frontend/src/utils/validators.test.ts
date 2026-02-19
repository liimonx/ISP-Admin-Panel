import { describe, it, expect } from 'vitest';
import { isValidIpAddress } from './validators';

describe('isValidIpAddress', () => {
  it('should return true for valid IPv4 addresses', () => {
    expect(isValidIpAddress('127.0.0.1')).toBe(true);
    expect(isValidIpAddress('192.168.1.1')).toBe(true);
    expect(isValidIpAddress('10.0.0.1')).toBe(true);
    expect(isValidIpAddress('172.16.0.1')).toBe(true);
    expect(isValidIpAddress('255.255.255.255')).toBe(true);
    expect(isValidIpAddress('0.0.0.0')).toBe(true);
    expect(isValidIpAddress('8.8.8.8')).toBe(true);
  });

  it('should return false for IPv4 addresses with out-of-range octets', () => {
    expect(isValidIpAddress('256.0.0.1')).toBe(false);
    expect(isValidIpAddress('192.168.1.256')).toBe(false);
    expect(isValidIpAddress('1.2.3.444')).toBe(false);
    expect(isValidIpAddress('300.300.300.300')).toBe(false);
  });

  it('should return false for incorrectly formatted IP addresses', () => {
    expect(isValidIpAddress('192.168.1')).toBe(false);
    expect(isValidIpAddress('192.168.1.1.1')).toBe(false);
    expect(isValidIpAddress('...')).toBe(false);
    expect(isValidIpAddress('1.2.3.')).toBe(false);
    expect(isValidIpAddress('.1.2.3')).toBe(false);
    expect(isValidIpAddress('1.2..3')).toBe(false);
  });

  it('should return false for non-numeric strings', () => {
    expect(isValidIpAddress('a.b.c.d')).toBe(false);
    expect(isValidIpAddress('192.168.1.a')).toBe(false);
    expect(isValidIpAddress('hello.world')).toBe(false);
  });

  it('should return false for empty or whitespace strings', () => {
    expect(isValidIpAddress('')).toBe(false);
    expect(isValidIpAddress(' ')).toBe(false);
    expect(isValidIpAddress('192. 168. 1. 1')).toBe(false);
  });

  it('should return false for IPv6 addresses', () => {
    expect(isValidIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(false);
    expect(isValidIpAddress('::1')).toBe(false);
  });

  it('should handle leading zeros correctly based on regex (some regex allow 01, some do not)', () => {
    // Current regex /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // [01]?[0-9][0-9]? matches 0, 00, 01, 001, etc.
    expect(isValidIpAddress('192.168.01.1')).toBe(true);
    expect(isValidIpAddress('192.168.001.001')).toBe(true);
  });
});
