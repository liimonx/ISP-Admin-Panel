from django.db import migrations, models
from core.encryption import EncryptionService

def encrypt_passwords(apps, schema_editor):
    Router = apps.get_model('network', 'Router')
    for router in Router.objects.all():
        # Access the field directly
        # Since we renamed the field, the model class from apps.get_model reflects the NEW state.
        # So the field is 'encrypted_password'.
        # The database column was renamed to 'encrypted_password' by RenameField.
        # The data in it is plaintext.
        plaintext = router.encrypted_password

        if plaintext:
             # Encrypt only if not already encrypted (EncryptionService handles check but good to be explicit/safe)
             encrypted = EncryptionService.encrypt(plaintext)
             if encrypted and encrypted != plaintext:
                 router.encrypted_password = encrypted
                 router.save()

def decrypt_passwords(apps, schema_editor):
    Router = apps.get_model('network', 'Router')
    for router in Router.objects.all():
        encrypted = router.encrypted_password
        decrypted = EncryptionService.decrypt(encrypted)
        if decrypted and decrypted != encrypted:
            router.encrypted_password = decrypted
            router.save()

class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_router_updates'),
    ]

    operations = [
        migrations.RenameField(
            model_name='router',
            old_name='password',
            new_name='encrypted_password',
        ),
        migrations.AlterField(
            model_name='router',
            name='encrypted_password',
            field=models.CharField(help_text='Router password (encrypted)', max_length=255),
        ),
        migrations.RunPython(encrypt_passwords, decrypt_passwords),
    ]
