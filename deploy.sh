#!/bin/bash

# ISP Admin Production Deployment Script
# This script deploys the ISP Admin application to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="isp-admin"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

echo -e "${BLUE}🚀 ISP Admin Production Deployment${NC}"
echo "===================================="
echo ""

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        log "${RED}❌ docker-compose.yml not found in current directory${NC}"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log "${RED}❌ .env file not found. Please create it from .env.example${NC}"
        exit 1
    fi
    
    log "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to backup current deployment
backup_deployment() {
    log "${YELLOW}Creating backup...${NC}"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose ps db | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T db pg_dump -U isp_admin isp_admin > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
        log "${GREEN}✅ Database backup completed${NC}"
    else
        log "${YELLOW}⚠️  Database not running, skipping backup${NC}"
    fi
    
    # Backup media files
    if [ -d "./backend/media" ]; then
        log "Backing up media files..."
        tar -czf "$BACKUP_DIR/media_backup_$(date +%Y%m%d_%H%M%S).tar.gz" ./backend/media
        log "${GREEN}✅ Media backup completed${NC}"
    fi
}

# Function to pull latest code
pull_latest_code() {
    log "${YELLOW}Pulling latest code...${NC}"
    
    # Check if we're in a git repository
    if [ -d ".git" ]; then
        git pull origin main
        log "${GREEN}✅ Code updated${NC}"
    else
        log "${YELLOW}⚠️  Not a git repository, skipping code update${NC}"
    fi
}

# Function to build images
build_images() {
    log "${YELLOW}Building Docker images...${NC}"
    
    # Build all images
    ./build-all.sh
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ Images built successfully${NC}"
    else
        log "${RED}❌ Image build failed${NC}"
        exit 1
    fi
}

# Function to deploy application
deploy_application() {
    log "${YELLOW}Deploying application...${NC}"
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose down
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    log "Checking service health..."
    
    # Check frontend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "${GREEN}✅ Frontend is healthy${NC}"
    else
        log "${YELLOW}⚠️  Frontend health check failed${NC}"
    fi
    
    # Check backend
    if curl -f http://localhost:8000/health/ > /dev/null 2>&1; then
        log "${GREEN}✅ Backend is healthy${NC}"
    else
        log "${YELLOW}⚠️  Backend health check failed${NC}"
    fi
}

# Function to run post-deployment tasks
post_deployment_tasks() {
    log "${YELLOW}Running post-deployment tasks...${NC}"
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose exec backend python manage.py migrate
    
    # Collect static files
    log "Collecting static files..."
    docker-compose exec backend python manage.py collectstatic --noinput
    
    # Clear cache
    log "Clearing cache..."
    docker-compose exec backend python manage.py clear_cache
    
    log "${GREEN}✅ Post-deployment tasks completed${NC}"
}

# Function to show deployment summary
show_deployment_summary() {
    log "${BLUE}📋 Deployment Summary${NC}"
    log "===================="
    log ""
    
    log "${YELLOW}🐳 Running Services:${NC}"
    docker-compose ps
    log ""
    
    log "${YELLOW}🌐 Access URLs:${NC}"
    log "Frontend: http://localhost:3000"
    log "Backend API: http://localhost:8000"
    log "Admin Panel: http://localhost:8000/admin"
    log ""
    
    log "${YELLOW}📊 Service Status:${NC}"
    log "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)"
    log "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health/)"
    log ""
    
    log "${YELLOW}🔍 Useful Commands:${NC}"
    log "View logs: docker-compose logs -f"
    log "Stop services: docker-compose down"
    log "Restart services: docker-compose restart"
    log ""
}

# Function to rollback deployment
rollback_deployment() {
    log "${RED}🔄 Rolling back deployment...${NC}"
    
    # Stop current services
    docker-compose down
    
    # Restore database backup
    LATEST_DB_BACKUP=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_DB_BACKUP" ]; then
        log "Restoring database from $LATEST_DB_BACKUP"
        docker-compose up -d db
        sleep 10
        docker-compose exec -T db psql -U isp_admin isp_admin < "$LATEST_DB_BACKUP"
    fi
    
    # Restore media backup
    LATEST_MEDIA_BACKUP=$(ls -t "$BACKUP_DIR"/media_backup_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_MEDIA_BACKUP" ]; then
        log "Restoring media from $LATEST_MEDIA_BACKUP"
        tar -xzf "$LATEST_MEDIA_BACKUP"
    fi
    
    # Start services
    docker-compose up -d
    
    log "${GREEN}✅ Rollback completed${NC}"
}

# Main deployment function
main() {
    log "Starting deployment at $(date)"
    log ""
    
    check_prerequisites
    backup_deployment
    pull_latest_code
    build_images
    deploy_application
    post_deployment_tasks
    show_deployment_summary
    
    log "${GREEN}🎉 Deployment completed successfully!${NC}"
    log ""
    log "Deployment completed at $(date)"
}

# Parse command line arguments
case "${1:-}" in
    "rollback")
        rollback_deployment
        ;;
    "backup")
        backup_deployment
        ;;
    "build")
        build_images
        ;;
    "deploy")
        deploy_application
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [rollback|backup|build|deploy|help]"
        echo ""
        echo "Options:"
        echo "  rollback  Rollback to previous deployment"
        echo "  backup    Create backup of current deployment"
        echo "  build     Build Docker images only"
        echo "  deploy    Deploy application only"
        echo "  help      Show this help message"
        echo ""
        echo "Default: Full deployment process"
        ;;
    *)
        main
        ;;
esac
