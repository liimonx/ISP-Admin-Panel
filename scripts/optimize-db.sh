#!/bin/bash
# Database optimization script

set -e

COMPOSE_FILE="${1:-docker-compose.prod.yml}"

echo "🔧 Starting database optimization..."

# Analyze tables
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running ANALYZE..."
docker-compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin} << EOF
ANALYZE;
EOF

# Vacuum and reindex
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running VACUUM..."
docker-compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin} << EOF
VACUUM FULL ANALYZE;
REINDEX DATABASE;
EOF

# Get database statistics
echo ""
echo "📊 Database Statistics:"
docker-compose -f ${COMPOSE_FILE} exec -T db psql -U ${POSTGRES_USER:-isp_admin} ${POSTGRES_DB:-isp_admin} << EOF
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF

echo ""
echo "✅ Database optimization completed!"
