#!/bin/bash
# Database restore script

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/isp_admin_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}'
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f ${BACKUP_FILE} ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from backup: ${BACKUP_FILE}"
echo "All current data will be lost!"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo "Starting database restore..."

# Stop services that depend on database
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate zero

# Drop and recreate database
docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-isp_admin} -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-isp_admin};"
docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-isp_admin} -d postgres -c "CREATE DATABASE ${POSTGRES_DB:-isp_admin};"

# Restore from backup
echo "Restoring from: ${BACKUP_FILE}"
gunzip -c ${BACKUP_FILE} | docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin}

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

echo "✓ Database restore completed!"
