#!/bin/bash
# Monitoring and health check script

set -e

COMPOSE_FILE="docker-compose.prod.yml"

echo "🔍 ISP Admin Panel - Health Check Report"
echo "======================================="
echo ""

# Check container status
echo "📦 Container Status:"
docker-compose -f ${COMPOSE_FILE} ps
echo ""

# Check disk usage
echo "💾 Disk Usage:"
df -h | grep -E "^/dev/|Filesystem"
echo ""

# Check Docker volume usage
echo "📊 Volume Usage:"
docker system df
echo ""

# Backend health
echo "🔗 Backend Health Check:"
BACKEND_HEALTH=$(docker-compose -f ${COMPOSE_FILE} exec -T backend curl -s http://localhost:8000/health/ || echo "Failed")
if [[ $BACKEND_HEALTH == *"ok"* ]]; then
    echo "✓ Backend: Healthy"
else
    echo "✗ Backend: Unhealthy"
fi
echo ""

# Database connection
echo "🗄️  Database Health Check:"
DB_HEALTH=$(docker-compose -f ${COMPOSE_FILE} exec -T db pg_isready -U ${POSTGRES_USER:-isp_admin} || echo "Failed")
if [[ $DB_HEALTH == *"accepting connections"* ]]; then
    echo "✓ Database: Healthy"
else
    echo "✗ Database: Unhealthy"
fi
echo ""

# Redis connection
echo "⚡ Redis Health Check:"
REDIS_HEALTH=$(docker-compose -f ${COMPOSE_FILE} exec -T redis redis-cli ping || echo "Failed")
if [[ $REDIS_HEALTH == "PONG" ]]; then
    echo "✓ Redis: Healthy"
else
    echo "✗ Redis: Unhealthy"
fi
echo ""

# Recent logs
echo "📋 Recent Logs:"
echo ""
echo "Backend logs (last 20 lines):"
docker-compose -f ${COMPOSE_FILE} logs --tail=20 backend
echo ""
echo "Nginx logs (last 20 lines):"
docker-compose -f ${COMPOSE_FILE} logs --tail=20 nginx
echo ""

echo "======================================="
echo "Report generated: $(date)"
