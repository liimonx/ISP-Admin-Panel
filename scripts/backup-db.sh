#!/bin/bash
# Database backup script - Run this daily via cron

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/isp_admin_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p ${BACKUP_DIR}

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Dump database
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin} | gzip > ${BACKUP_FILE}

if [ -f ${BACKUP_FILE} ]; then
    SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✗ Backup failed!"
    exit 1
fi

# Clean old backups (older than 30 days)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaning old backups..."
find ${BACKUP_DIR} -name "isp_admin_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Backup statistics
BACKUP_COUNT=$(ls -1 ${BACKUP_DIR}/isp_admin_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh ${BACKUP_DIR} | cut -f1)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backups available: ${BACKUP_COUNT}, Total size: ${TOTAL_SIZE}"
