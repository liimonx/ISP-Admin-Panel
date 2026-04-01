# Production Operations Guide

## Table of Contents
1. [Monitoring & Logging](#monitoring--logging)
2. [Performance Tuning](#performance-tuning)
3. [Scaling](#scaling)
4. [Disaster Recovery](#disaster-recovery)
5. [Maintenance](#maintenance)

---

## Monitoring & Logging

### Start Monitoring Stack

```bash
# Start Prometheus, Grafana, AlertManager
docker-compose -f docker-compose.monitoring.yml up -d

# Access points
# Prometheus:    http://localhost:9090
# Grafana:       http://localhost:3001 (admin/admin)
# AlertManager:  http://localhost:9093
```

### Start Logging Stack

```bash
# Start Elasticsearch, Logstash, Kibana, Filebeat
docker-compose -f docker-compose.logging.yml up -d

# Access points
# Kibana:        http://localhost:5601
# Elasticsearch: http://localhost:9200
```

### Key Metrics to Monitor

| Metric | Alert | Critical | Action |
|--------|-------|----------|--------|
| CPU Usage | >70% | >90% | Scale horizontally or optimize code |
| Memory Usage | >80% | >95% | Increase container memory limits |
| Disk Usage | >75% | >90% | Clean old data or add storage |
| DB Connections | >80 | >100 | Optimize queries or scale DB |
| Response Time | >1s | >5s | Check logs and optimize |
| Error Rate | >5% | >10% | Debug errors in logs |

### Grafana Dashboards

Pre-configured dashboards available:
- **System Overview** - CPU, Memory, Disk
- **Application Metrics** - Request rates, response times
- **Database** - Connections, query times
- **Redis** - Memory, hit rate
- **Celery** - Task execution, failures

### Alert Configuration

Edit `monitoring/alertmanager.yml` to configure:
- Email notifications
- Slack webhooks
- PagerDuty integration
- Custom webhooks

---

## Performance Tuning

### Database Optimization

```bash
# Analyze query performance
docker-compose -f docker-compose.prod.yml exec backend \
  python manage.py shell -c "
import django.db.connection
from django.db import connection
connection.queries_log.clear()
# Run your queries
for q in connection.queries:
    print(q['time'], q['sql'])
"

# Optimize database
./scripts/optimize-db.sh

# Check index usage
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin << EOF
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
EOF
```

### Django Performance

```bash
# Enable query caching
# In settings.py: CACHES['default']['TIMEOUT'] = 300

# Use database connection pooling
# In settings.py: CONN_MAX_AGE = 600

# Enable template caching
# In settings.py: LOADERS = [('django.template.loaders.cached.Loader', [...])]

# Optimize static files
docker-compose -f docker-compose.prod.yml exec backend \
  python manage.py collectstatic --noinput --clear

# Check for N+1 queries
# Use django-debug-toolbar in development
# Use django-extensions: python manage.py shell_plus
```

### Nginx Optimization

```bash
# Enable gzip (already in nginx.prod.conf)
# Increase buffer sizes
# Enable HTTP/2
# Configure caching headers

# Test configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Redis Optimization

```bash
# Monitor Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO

# Check memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO memory

# Optimize memory
# - Enable maxmemory eviction policy
# - Use Redis compression
# - Remove unnecessary data

# Persistence settings (in docker-compose.prod.yml)
# - RDB snapshots
# - AOF (Append Only File)
```

### Celery Optimization

```bash
# Monitor tasks
docker-compose -f docker-compose.prod.yml exec backend \
  celery -A isp_admin events --camera django_celery_beat.schedulers:DatabaseScheduler

# Optimize worker configuration
# - Increase concurrency for I/O bound tasks
# - Use Prefork pool for CPU bound tasks
# - Configure max-tasks-per-child for memory leaks

# Check task queue
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# In redis-cli
LLEN celery
LRANGE celery 0 -1
```

---

## Scaling

### Horizontal Scaling (Multiple Servers)

#### 1. Load Balancing Setup

```bash
# Install HAProxy or use AWS ELB
# Configure health checks
# Setup sticky sessions for authenticated users
```

#### 2. Database Replication

```bash
# Setup PostgreSQL streaming replication
# Configure standby servers
# Setup automated failover

# Example replication script
cat > /opt/isp-admin/scripts/setup-replication.sh << 'EOF'
#!/bin/bash
# Setup PostgreSQL replication
# Configure replication slots
# Monitor replication lag
EOF
```

#### 3. Redis Sentinel/Cluster

```bash
# Setup Redis Sentinel for high availability
# Or use Redis Cluster for horizontal scaling

docker-compose -f docker-compose.prod.yml exec redis redis-cli \
  SENTINEL masters
```

### Vertical Scaling (Bigger Machines)

```bash
# Increase memory limits
# - Update docker-compose.prod.yml resource limits
# - Restart services

# Increase CPU
# - Scale backend workers: --workers 8
# - Scale Celery concurrency: --concurrency 8

# Increase storage
# - Add volume to existing PV
# - Or create new PV and migrate data
```

### Kubernetes Scaling

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml

# Scale deployments
kubectl scale deployment backend --replicas=5 -n isp-admin

# Check HPA
kubectl get hpa -n isp-admin

# Monitor metrics
kubectl top nodes
kubectl top pods -n isp-admin
```

---

## Disaster Recovery

### Backup Strategy

#### Automated Daily Backups
```bash
# Already configured in deploy.sh
# Runs at 2 AM daily
crontab -e
0 2 * * * /opt/isp-admin/scripts/backup-db.sh
```

#### Manual Backup
```bash
./scripts/backup-db.sh
```

#### Backup Verification
```bash
# List backups
ls -lh backups/

# Test restore (in isolated environment)
./scripts/restore-db.sh backups/latest.sql.gz
```

### Restore Procedures

#### Full System Restore
```bash
# 1. Restore database
./scripts/restore-db.sh backups/isp_admin_YYYYMMDD.sql.gz

# 2. Verify restore
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin -c "SELECT COUNT(*) FROM auth_user;"

# 3. Restart services
docker-compose -f docker-compose.prod.yml restart

# 4. Run migrations if needed
./scripts/migrate-db.sh docker-compose.prod.yml
```

#### Partial Restore (Single Table)
```bash
# Restore specific table from backup
gunzip -c backups/isp_admin_YYYYMMDD.sql.gz | \
  grep -A 10000 "CREATE TABLE auth_user" | \
  docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin
```

### Point-in-Time Recovery

```bash
# With PostgreSQL WAL archiving
# 1. Setup WAL archiving
# 2. Store WAL files offsite
# 3. Use pg_basebackup for backups
# 4. Restore to specific timestamp

docker-compose -f docker-compose.prod.yml exec db \
  pg_restore --help | grep recovery
```

### Failover Procedures

#### Database Failover
```bash
# If using replication
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin << EOF
-- Promote standby to primary
SELECT pg_promote();
EOF
```

#### Application Failover
```bash
# If using load balancer
# 1. Remove failed server from load balancer
# 2. Wait for connections to drain
# 3. Restart services
# 4. Add back to load balancer
```

---

## Maintenance

### Daily Tasks

```bash
# Morning (before work)
./scripts/health-check.sh

# Check backup status
ls -lt backups/ | head -1

# Review error logs
docker-compose -f docker-compose.prod.yml logs --tail=100 backend | grep -i error
```

### Weekly Tasks

```bash
# Monday morning
# 1. Review performance metrics
# 2. Check disk usage
# 3. Verify backup integrity
# 4. Review security logs

# Check for updates
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull nginx:alpine

# Test failover/recovery procedures
```

### Monthly Tasks

```bash
# 1. Full database integrity check
docker-compose -f docker-compose.prod.yml exec db \
  pg_dump --verbose ${POSTGRES_DB} > /dev/null

# 2. SSL certificate check
openssl x509 -in ssl/cert.pem -noout -dates

# 3. Security audit
./scripts/security-audit.sh

# 4. Capacity planning
df -h
du -sh /opt/isp-admin/*

# 5. Performance review
# Check metrics from Prometheus/Grafana
```

### Quarterly Tasks

```bash
# 1. Full disaster recovery test
# Restore from backup to test environment
# Verify all functionality

# 2. Security patches
# Update Docker images
# Update dependencies

# 3. Documentation review
# Update runbooks
# Update procedures

# 4. Capacity upgrade if needed
```

### Seasonal Tasks (Yearly)

```bash
# 1. Major version upgrades
# Django, PostgreSQL, Redis, etc.

# 2. Hardware refresh
# Plan for server upgrades

# 3. Compliance review
# Data protection
# Security standards

# 4. Disaster recovery plan review
# Update RTO/RPO targets
# Review procedures
```

---

## Troubleshooting During Operations

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service]

# Check port conflicts
lsof -i :[port]

# Check docker daemon
systemctl status docker

# Check disk space
df -h

# Check memory
free -h
```

### High Resource Usage

```bash
# Identify process
docker stats

# Check for memory leaks
docker inspect [container] | grep Memory

# Kill zombie processes
ps aux | grep defunct
kill -9 [pid]

# Scale service
docker-compose -f docker-compose.prod.yml scale backend=3
```

### Database Issues

```bash
# Check connections
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin -c \
  "SELECT pid, usename, state FROM pg_stat_activity;"

# Kill idle connections
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# Check locks
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin -c \
  "SELECT * FROM pg_locks WHERE NOT granted;"
```

### Redis Issues

```bash
# Check memory
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO memory

# Flush cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL

# Check persistence
docker-compose -f docker-compose.prod.yml exec redis redis-cli LASTSAVE
```

---

## Runbooks

### Emergency Shutdown

```bash
docker-compose -f docker-compose.prod.yml down
# Services will stop gracefully
# Volumes preserved
```

### Emergency Start

```bash
docker-compose -f docker-compose.prod.yml up -d
# Services start in dependency order
# Database checks for migrations
```

### Complete System Reset (Dangerous!)

```bash
docker-compose -f docker-compose.prod.yml down -v
# WARNING: Deletes all volumes and data!
docker-compose -f docker-compose.prod.yml up -d
# Fresh system with empty database
```

---

## Contact & Escalation

- **Operations Team**: [contact]
- **Database Admin**: [contact]
- **Security Team**: [contact]
- **CTO/Management**: [contact]

---

**Last Updated**: 2024
**Version**: 1.0
