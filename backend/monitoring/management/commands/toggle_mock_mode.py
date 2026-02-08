from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Toggle MikroTik mock mode on/off'

    def add_arguments(self, parser):
        parser.add_argument(
            '--enable',
            action='store_true',
            help='Enable mock mode',
        )
        parser.add_argument(
            '--disable',
            action='store_true',
            help='Disable mock mode',
        )

    def handle(self, *args, **options):
        env_file = os.path.join(settings.BASE_DIR, '.env')
        
        if options['enable']:
            self.stdout.write('Enabling MikroTik mock mode...')
            self._update_env_file(env_file, 'MIKROTIK_MOCK_MODE', 'True')
            self.stdout.write(
                self.style.SUCCESS('Mock mode enabled. Restart the server to apply changes.')
            )
        elif options['disable']:
            self.stdout.write('Disabling MikroTik mock mode...')
            self._update_env_file(env_file, 'MIKROTIK_MOCK_MODE', 'False')
            self.stdout.write(
                self.style.SUCCESS('Mock mode disabled. Restart the server to apply changes.')
            )
        else:
            current_mode = getattr(settings, 'MIKROTIK_MOCK_MODE', True)
            self.stdout.write(f'Current mock mode: {"Enabled" if current_mode else "Disabled"}')
            self.stdout.write('Use --enable or --disable to change the mode')

    def _update_env_file(self, env_file, key, value):
        """Update or add a key-value pair in the .env file"""
        lines = []
        key_found = False
        
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                lines = f.readlines()
        
        # Update existing key or add new one
        for i, line in enumerate(lines):
            if line.startswith(f'{key}='):
                lines[i] = f'{key}={value}\n'
                key_found = True
                break
        
        if not key_found:
            lines.append(f'{key}={value}\n')
        
        # Write back to file
        with open(env_file, 'w') as f:
            f.writelines(lines)