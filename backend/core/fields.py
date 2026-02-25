from django.db import models
from django.utils.translation import gettext_lazy as _
from .encryption import AESCipher

class EncryptedCharField(models.CharField):
    description = _("Encrypted CharField")

    def __init__(self, *args, **kwargs):
        # Default max_length to 255 if not specified to accommodate encryption overhead
        if 'max_length' not in kwargs:
            kwargs['max_length'] = 255
        super().__init__(*args, **kwargs)
        self.cipher = AESCipher()

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None:
            return None
        return self.cipher.encrypt(value)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
        return self.cipher.decrypt(value)

    def to_python(self, value):
        if value is None:
            return None
        return self.cipher.decrypt(value)
