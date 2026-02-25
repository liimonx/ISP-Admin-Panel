from django.test import TestCase
from network.models import Router
from core.encryption import EncryptionService

class RouterEncryptionTest(TestCase):

    def test_password_encryption(self):
        # Create a router with a password
        plaintext_password = "secure_password_123"
        router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            username="admin",
            password=plaintext_password
        )

        # Verify the password property returns plaintext
        self.assertEqual(router.password, plaintext_password)

        # Verify the database stores encrypted password
        router.refresh_from_db()
        self.assertNotEqual(router.encrypted_password, plaintext_password)
        self.assertTrue(router.encrypted_password.startswith(EncryptionService.PREFIX))

        # Verify decryption works manually
        decrypted = EncryptionService.decrypt(router.encrypted_password)
        self.assertEqual(decrypted, plaintext_password)

    def test_legacy_plaintext_password(self):
        # Create a router with encrypted_password set to plaintext (simulating legacy data)
        plaintext = "legacy_password"
        router = Router.objects.create(
            name="Legacy Router",
            host="192.168.1.2",
            username="admin",
            encrypted_password=plaintext
        )

        # Verify property returns plaintext (fallback mechanism)
        self.assertEqual(router.password, plaintext)

        # Verify it is stored as plaintext
        router.refresh_from_db()
        self.assertEqual(router.encrypted_password, plaintext)

        # Now update it via property setter
        new_password = "new_secure_password"
        router.password = new_password
        router.save()

        # Verify it is now encrypted
        router.refresh_from_db()
        self.assertNotEqual(router.encrypted_password, new_password)
        self.assertTrue(router.encrypted_password.startswith(EncryptionService.PREFIX))
        self.assertEqual(router.password, new_password)

    def test_empty_password(self):
        # Test empty password behavior
        router = Router.objects.create(
            name="Empty Password Router",
            host="192.168.1.3",
            username="admin",
            password=""
        )

        self.assertEqual(router.password, "")
        # Empty string encrypts to empty string based on EncryptionService implementation
        self.assertEqual(router.encrypted_password, "")
