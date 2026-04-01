#!/bin/bash
set -e

echo "🚀 ISP Admin Panel - Production Deployment Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Environment Setup
echo -e "${BLUE}[1/7]${NC} Setting up environment..."
if [ ! -f .env.prod ]; then
    cp .env.prod.example .env.prod
    echo -e "${YELLOW}⚠️  Created .env.prod from template. EDIT THIS FILE WITH YOUR SETTINGS!${NC}"
    echo -e "${YELLOW}Run: nano .env.prod${NC}"
    exit 1
fi
source .env.prod
echo -e "${GREEN}✓ Environment configured${NC}"

# 2. SSL Certificate Setup
echo -e "${BLUE}[2/7]${NC} Checking SSL certificates..."
if [ ! -d "ssl" ]; then
    mkdir -p ssl
    echo -e "${YELLOW}⚠️  No SSL certificates found. Using self-signed for testing.${NC}"
    echo -e "${YELLOW}For production, use Let's Encrypt or your CA certificates.${NC}"
    
    # Generate self-signed cert for testing
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/CN=localhost/O=ISP Admin/C=US" 2>/dev/null || true
    
    echo -e "${YELLOW}📝 Replace ssl/cert.pem and ssl/key.pem with your production certificates.${NC}"
fi
echo -e "${GREEN}✓ SSL certificates ready${NC}"

# 3. Database Backup
echo -e "${BLUE}[3/7]${NC} Setting up backup directory..."
mkdir -p backups
echo -e "${GREEN}✓ Backup directory created${NC}"

# 4. Logs Directory
echo -e "${BLUE}[4/7]${NC} Setting up logs directory..."
mkdir -p backend/logs
chmod 755 backend/logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# 5. Docker Build
echo -e "${BLUE}[5/7]${NC} Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✓ Docker images built${NC}"

# 6. Start Services
echo -e "${BLUE}[6/7]${NC} Starting services..."
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 10

# 7. Database Initialization
echo -e "${BLUE}[7/7]${NC} Initializing database..."

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
echo -e "${GREEN}✓ Database migrated${NC}"

# Collect static files
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"

# Create superuser if needed
echo -e "${YELLOW}Creating superuser...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='${DJANGO_SUPERUSER_USERNAME}').exists():
    User.objects.create_superuser(
        username='${DJANGO_SUPERUSER_USERNAME}',
        email='${DJANGO_SUPERUSER_EMAIL}',
        password='${DJANGO_SUPERUSER_PASSWORD}'
    )
    print("✓ Superuser created")
else:
    print("✓ Superuser already exists")
EOF

# Show status
echo -e "\n${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}\n"

# Services status
echo -e "${BLUE}Services Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n${BLUE}Important Information:${NC}"
echo "📌 Frontend URL: https://yourdomain.com"
echo "📌 Backend API: https://api.yourdomain.com/api/"
echo "📌 Admin Panel: https://api.yourdomain.com/admin/"
echo "📌 API Docs: https://api.yourdomain.com/api/schema/swagger/"
echo ""
echo -e "${YELLOW}⚠️  Update these URLs in nginx.prod.conf before going live${NC}"
echo "⚠️  Configure your DNS to point to this server"
echo "⚠️  Renew SSL certificates before expiry"
echo ""

# Next steps
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update ALLOWED_HOSTS in .env.prod with your domain"
echo "2. Replace SSL certificates in ssl/ directory"
echo "3. Update nginx.prod.conf with your domain names"
echo "4. Set up automated backups:"
echo "   crontab -e"
echo "   0 2 * * * /path/to/scripts/backup-db.sh"
echo "5. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
