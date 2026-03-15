import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeText, sanitizeEmail, sanitizePhone } from './sanitizer';

describe('sanitizer utilities', () => {
  describe('sanitize', () => {
    it('should return an empty string if input is empty, null, or undefined', () => {
      expect(sanitize('')).toBe('');
      expect(sanitize(null as unknown as string)).toBe('');
      expect(sanitize(undefined as unknown as string)).toBe('');
    });

    it('should trim whitespace from both ends', () => {
      expect(sanitize('  hello  ')).toBe('hello');
      expect(sanitize('\tworld\n')).toBe('world');
    });

    it('should remove <, >, ", and \' characters', () => {
      expect(sanitize('<script>')).toBe('script');
      expect(sanitize('"hello"')).toBe('hello');
      expect(sanitize("'world'")).toBe('world');
      expect(sanitize('<a href="test">\'link\'</a>')).toBe('a href=testlink/a');
    });

    it('should leave innocent strings unchanged (other than trimming)', () => {
      expect(sanitize('Hello World 123')).toBe('Hello World 123');
      expect(sanitize('email@example.com')).toBe('email@example.com');
      expect(sanitize('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
      expect(sanitize('!@#$%^&*()_+={}[]|\\:;?/,.~`')).toBe('!@#$%^&*()_+={}[]|\\:;?/,.~`');
    });

    it('should effectively sanitize basic XSS attempts', () => {
      expect(sanitize('<script>alert("XSS")</script>')).toBe('scriptalert(XSS)/script');
      expect(sanitize('<img src="x" onerror="alert(\'XSS\')">')).toBe('img src=x onerror=alert(XSS)');
      expect(sanitize('javascript:alert("XSS")')).toBe('javascript:alert(XSS)');
    });
  });

  describe('aliases', () => {
    it('sanitizeText should behave exactly like sanitize', () => {
      expect(sanitizeText('<test> "123"')).toBe(sanitize('<test> "123"'));
      expect(sanitizeText).toBe(sanitize);
    });

    it('sanitizeEmail should behave exactly like sanitize', () => {
      expect(sanitizeEmail('<test> "123"')).toBe(sanitize('<test> "123"'));
      expect(sanitizeEmail).toBe(sanitize);
    });

    it('sanitizePhone should behave exactly like sanitize', () => {
      expect(sanitizePhone('<test> "123"')).toBe(sanitize('<test> "123"'));
      expect(sanitizePhone).toBe(sanitize);
    });
  });
});
