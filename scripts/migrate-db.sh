#!/bin/bash
# Database migration and initialization script

set -e

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
BACKUP_DIR="backups"

echo "🗄️  Starting database migration..."

# Create backup before migration
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Creating pre-migration backup..."
mkdir -p ${BACKUP_DIR}
BACKUP_FILE="${BACKUP_DIR}/pre-migration_$(date +%Y%m%d_%H%M%S).sql.gz"

docker-compose -f ${COMPOSE_FILE} exec -T db pg_dump -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin} | gzip > ${BACKUP_FILE}
echo "✓ Backup created: ${BACKUP_FILE}"

# Run migrations
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running Django migrations..."
docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py migrate --no-input

# Collect static files
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Collecting static files..."
docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py collectstatic --noinput

# Clear cache
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Clearing cache..."
docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py shell -c "from django.core.cache import cache; cache.clear()"

# Create/update superuser
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Setting up superuser..."
docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()

username = '${DJANGO_SUPERUSER_USERNAME:-admin}'
email = '${DJANGO_SUPERUSER_EMAIL:-admin@example.com}'
password = '${DJANGO_SUPERUSER_PASSWORD:-admin}'

if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.email = email
    user.set_password(password)
    user.save()
    print(f'✓ Updated existing superuser: {username}')
else:
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'✓ Created superuser: {username}')
EOF

# Run any custom management commands
if [ -f "scripts/post-migration.sh" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running post-migration tasks..."
    ./scripts/post-migration.sh
fi

echo ""
echo "✅ Database migration completed successfully!"
echo "Backup location: ${BACKUP_FILE}"
echo ""
