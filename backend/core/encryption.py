import base64
import hashlib
from django.conf import settings
from Cryptodome.Cipher import AES
from Cryptodome.Random import get_random_bytes

class EncryptionService:
    """
    Service for encrypting and decrypting sensitive data using AES-GCM.
    Uses settings.SECRET_KEY to derive the encryption key.
    """
    PREFIX = "enc:v1:"

    @staticmethod
    def _get_key():
        # Derive a 32-byte key from the SECRET_KEY using SHA-256
        # Ensure SECRET_KEY is not empty/None
        if not settings.SECRET_KEY:
            raise ValueError("SECRET_KEY is not configured")
        return hashlib.sha256(settings.SECRET_KEY.encode()).digest()

    @staticmethod
    def encrypt(plaintext):
        """
        Encrypts plaintext using AES-GCM.
        Returns base64 encoded string with prefix.
        Raises exception if encryption fails.
        """
        if not plaintext:
            return "" # Return empty string for empty input to be safe for CharField

        # If already encrypted (starts with prefix), return as is to prevent double encryption
        if plaintext.startswith(EncryptionService.PREFIX):
            return plaintext

        # AES-GCM needs a nonce (recommended 12 bytes)
        nonce = get_random_bytes(12)
        key = EncryptionService._get_key()

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode('utf-8'))

        # Combine nonce + tag + ciphertext and encode as base64
        # Format: nonce(12) + tag(16) + ciphertext(n)
        encrypted_data = nonce + tag + ciphertext
        base64_str = base64.b64encode(encrypted_data).decode('utf-8')

        return EncryptionService.PREFIX + base64_str

    @staticmethod
    def decrypt(encrypted_text):
        """
        Decrypts ciphertext using AES-GCM.
        Returns plaintext string.
        If input doesn't start with prefix or decryption fails, returns input as-is (assuming plaintext).
        """
        if not encrypted_text:
            return ""

        if not encrypted_text.startswith(EncryptionService.PREFIX):
            return encrypted_text

        try:
            payload = encrypted_text[len(EncryptionService.PREFIX):]

            # Decode base64
            data = base64.b64decode(payload.encode('utf-8'))

            if len(data) < 28: # 12 (nonce) + 16 (tag)
                 return encrypted_text

            # Extract parts
            nonce = data[:12]
            tag = data[12:28]
            ciphertext = data[28:]

            key = EncryptionService._get_key()
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

            plaintext = cipher.decrypt_and_verify(ciphertext, tag)
            return plaintext.decode('utf-8')
        except (ValueError, KeyError, Exception):
            # Decryption failed (invalid key, tampered data, or not encrypted correctly)
            # Return original text to support legacy/migration scenarios
            return encrypted_text
