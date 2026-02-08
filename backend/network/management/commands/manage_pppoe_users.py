"""
Management command to manage PPPoE users on MikroTik routers.
"""
from django.core.management.base import BaseCommand, CommandError
from network.models import Router
from network.services import MikroTikService
from subscriptions.models import Subscription


class Command(BaseCommand):
    help = 'Manage PPPoE users on MikroTik routers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--router-id',
            type=int,
            help='Router ID to manage users on',
        )
        parser.add_argument(
            '--action',
            choices=['list', 'create', 'delete', 'enable', 'disable', 'sync'],
            required=True,
            help='Action to perform',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Username for create/delete/enable/disable actions',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for create action',
        )
        parser.add_argument(
            '--profile',
            type=str,
            help='Profile for create action',
        )
        parser.add_argument(
            '--limit-in',
            type=str,
            help='Download limit for create action (e.g., 10M, 1G)',
        )
        parser.add_argument(
            '--limit-out',
            type=str,
            help='Upload limit for create action (e.g., 10M, 1G)',
        )

    def handle(self, *args, **options):
        if not options['router_id']:
            raise CommandError('Router ID is required')

        try:
            router = Router.objects.get(id=options['router_id'])
        except Router.DoesNotExist:
            raise CommandError(f'Router with ID {options["router_id"]} does not exist')

        service = MikroTikService(router)
        action = options['action']

        try:
            if action == 'list':
                self.list_users(service, router)
            elif action == 'create':
                self.create_user(service, router, options)
            elif action == 'delete':
                self.delete_user(service, router, options)
            elif action == 'enable':
                self.enable_user(service, router, options)
            elif action == 'disable':
                self.disable_user(service, router, options)
            elif action == 'sync':
                self.sync_users(service, router)
        except Exception as e:
            raise CommandError(f'Error performing action: {str(e)}')

    def list_users(self, service, router):
        """List all PPPoE users on the router."""
        self.stdout.write(f'PPPoE users on {router.name}:')
        users = service.get_pppoe_users()
        
        if not users:
            self.stdout.write('  No users found')
            return

        for user in users:
            status = 'Disabled' if user.get('disabled') else 'Enabled'
            self.stdout.write(
                f'  • {user["username"]} - {status}\n'
                f'    Service: {user.get("service", "N/A")}\n'
                f'    Caller ID: {user.get("caller_id", "N/A")}\n'
                f'    Uptime: {user.get("uptime", "N/A")}\n'
                f'    Limits: {user.get("limit_bytes_in", "N/A")} / {user.get("limit_bytes_out", "N/A")}'
            )

    def create_user(self, service, router, options):
        """Create a new PPPoE user."""
        username = options.get('username')
        password = options.get('password')
        
        if not username or not password:
            raise CommandError('Username and password are required for create action')

        profile = options.get('profile')
        limit_in = options.get('limit_in')
        limit_out = options.get('limit_out')

        self.stdout.write(f'Creating PPPoE user {username} on {router.name}...')
        
        success = service.create_pppoe_user(
            username=username,
            password=password,
            profile=profile,
            limit_bytes_in=limit_in,
            limit_bytes_out=limit_out
        )
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ User {username} created successfully'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to create user {username}'))

    def delete_user(self, service, router, options):
        """Delete a PPPoE user."""
        username = options.get('username')
        
        if not username:
            raise CommandError('Username is required for delete action')

        self.stdout.write(f'Deleting PPPoE user {username} from {router.name}...')
        
        success = service.delete_pppoe_user(username)
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ User {username} deleted successfully'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to delete user {username}'))

    def enable_user(self, service, router, options):
        """Enable a PPPoE user."""
        username = options.get('username')
        
        if not username:
            raise CommandError('Username is required for enable action')

        self.stdout.write(f'Enabling PPPoE user {username} on {router.name}...')
        
        success = service.enable_pppoe_user(username)
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ User {username} enabled successfully'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to enable user {username}'))

    def disable_user(self, service, router, options):
        """Disable a PPPoE user."""
        username = options.get('username')
        
        if not username:
            raise CommandError('Username is required for disable action')

        self.stdout.write(f'Disabling PPPoE user {username} on {router.name}...')
        
        success = service.disable_pppoe_user(username)
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ User {username} disabled successfully'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to disable user {username}'))

    def sync_users(self, service, router):
        """Sync PPPoE users with database subscriptions."""
        self.stdout.write(f'Syncing PPPoE users on {router.name} with database...')
        
        # Get active subscriptions for this router
        active_subscriptions = Subscription.objects.filter(
            router=router,
            status='active'
        ).select_related('customer', 'plan')
        
        # Get current PPPoE users on router
        router_users = service.get_pppoe_users()
        router_usernames = {user['username'] for user in router_users}
        
        created_count = 0
        disabled_count = 0
        
        # Create missing users
        for subscription in active_subscriptions:
            if subscription.username not in router_usernames:
                self.stdout.write(f'  Creating user: {subscription.username}')
                success = service.create_pppoe_user(
                    username=subscription.username,
                    password=subscription.password,
                    profile=subscription.plan.name if subscription.plan else None
                )
                if success:
                    created_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f'    Failed to create {subscription.username}'))
        
        # Disable users not in active subscriptions
        active_usernames = {sub.username for sub in active_subscriptions}
        for user in router_users:
            if user['username'] not in active_usernames and not user.get('disabled'):
                self.stdout.write(f'  Disabling user: {user["username"]}')
                success = service.disable_pppoe_user(user['username'])
                if success:
                    disabled_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f'    Failed to disable {user["username"]}'))
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Sync completed: {created_count} users created, {disabled_count} users disabled'
            )
        )