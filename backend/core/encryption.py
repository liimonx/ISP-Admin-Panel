import base64
import hashlib
from django.conf import settings
from Cryptodome.Cipher import AES
from Cryptodome.Random import get_random_bytes

class AESCipher:
    def __init__(self):
        # Derive a 32-byte key from the SECRET_KEY using SHA-256
        self.key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()

    def encrypt(self, raw):
        if raw is None:
            return None
        if not isinstance(raw, str):
            raw = str(raw)

        nonce = get_random_bytes(12)
        cipher = AES.new(self.key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(raw.encode())

        # Combine nonce + tag + ciphertext and encode to base64
        encrypted_data = nonce + tag + ciphertext
        return base64.b64encode(encrypted_data).decode('utf-8')

    def decrypt(self, enc):
        if enc is None:
            return None

        try:
            # Decode from base64
            encrypted_data = base64.b64decode(enc)

            # Extract nonce, tag, and ciphertext
            nonce = encrypted_data[:12]
            tag = encrypted_data[12:28]
            ciphertext = encrypted_data[28:]

            cipher = AES.new(self.key, AES.MODE_GCM, nonce=nonce)
            return cipher.decrypt_and_verify(ciphertext, tag).decode('utf-8')
        except (ValueError, KeyError, IndexError):
            # Return raw string if decryption fails (e.g. if data was not encrypted)
            return enc
