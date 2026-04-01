#!/bin/bash
# Production deployment update script

set -e

COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="logs/deployment-$(date +%Y%m%d_%H%M%S).log"

mkdir -p logs

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting production update..."
    
    # Pull latest code
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Pulling latest code..."
    git pull origin main
    
    # Backup database before update
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backing up database..."
    ./scripts/backup-db.sh
    
    # Build images
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Building Docker images..."
    docker-compose -f ${COMPOSE_FILE} build --no-cache
    
    # Stop old containers
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Stopping services..."
    docker-compose -f ${COMPOSE_FILE} down
    
    # Start new containers
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting services..."
    docker-compose -f ${COMPOSE_FILE} up -d
    
    # Wait for services
    sleep 10
    
    # Run migrations
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running migrations..."
    docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py migrate
    
    # Collect static files
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Collecting static files..."
    docker-compose -f ${COMPOSE_FILE} exec -T backend python manage.py collectstatic --noinput
    
    # Verify health
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Verifying service health..."
    docker-compose -f ${COMPOSE_FILE} ps
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Deployment completed successfully!"
    
} | tee -a ${LOG_FILE}
