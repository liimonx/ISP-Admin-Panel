// Basic sanitization for early development
export const sanitize = (input: string): string => {
  if (!input) return '';
  return input.replace(/[<>"']/g, '').trim();
};

export const sanitizeText = sanitize;
export const sanitizeEmail = sanitize;
export const sanitizePhone = sanitize;