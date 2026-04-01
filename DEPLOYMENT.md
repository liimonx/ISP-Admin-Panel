# Production Deployment Guide - ISP Admin Panel

## Pre-Deployment Checklist

- [ ] Domain name registered and DNS configured
- [ ] SSL certificates obtained (Let's Encrypt or CA)
- [ ] Server specifications met (see requirements below)
- [ ] All environment variables configured
- [ ] Database backup strategy planned
- [ ] Monitoring and alerts configured
- [ ] Support plan and incident response documented

## Server Requirements

### Minimum Specifications
- **CPU**: 2-4 cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB SSD (database + media)
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

### Recommended Specifications (Production)
- **CPU**: 4-8 cores
- **RAM**: 8-16GB
- **Storage**: 100GB+ SSD
- **Network**: 100Mbps+ connection

## Installation Steps

### 1. Prerequisites Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Create app directory
mkdir -p /opt/isp-admin
cd /opt/isp-admin
```

### 2. Clone Repository

```bash
git clone https://github.com/liimonx/ISP-Admin-Panel.git .
cd /opt/isp-admin
```

### 3. Environment Configuration

```bash
# Copy production environment file
cp .env.prod.example .env.prod

# Edit with your settings
nano .env.prod
```

**Critical Settings to Configure:**
- `SECRET_KEY`: Generate a strong random key
- `ALLOWED_HOSTS`: Your domain names
- `POSTGRES_PASSWORD`: Strong database password
- `REDIS_PASSWORD`: Strong Redis password
- `MAIN_ROUTER_IP`: Your MikroTik router IP
- `EMAIL_HOST_USER`: For sending notifications
- Payment provider credentials

### 4. SSL Certificates

```bash
# For Let's Encrypt (recommended)
sudo apt-get install -y certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to ssl directory
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

### 5. Run Deployment Script

```bash
# Make scripts executable
chmod +x deploy.sh
chmod +x scripts/*.sh

# Run deployment
./deploy.sh
```

## Post-Deployment Configuration

### 1. Update Nginx Configuration

Edit `nginx.prod.conf` and replace:
- `yourdomain.com` with your actual domain
- SSL certificate paths if different

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### 2. Verify Services

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run health check
./scripts/health-check.sh
```

### 3. Access Applications

- **Frontend**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin/
- **API Docs**: https://yourdomain.com/api/schema/swagger/
- **Admin Username**: Check DJANGO_SUPERUSER_USERNAME in .env.prod

## Database Management

### Automated Daily Backups

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Add to crontab for automatic daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * /opt/isp-admin/scripts/backup-db.sh >> /opt/isp-admin/logs/backup.log 2>&1
```

### Manual Backup

```bash
./scripts/backup-db.sh
```

### Restore from Backup

```bash
./scripts/restore-db.sh backups/isp_admin_YYYYMMDD_HHMMSS.sql.gz
```

## Monitoring & Maintenance

### System Resource Monitoring

```bash
# Docker stats
docker stats

# Container logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Health check script
./scripts/health-check.sh
```

### Common Issues

**Database Connection Failed**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps db

# View logs
docker-compose -f docker-compose.prod.yml logs db
```

**High Memory Usage**
```bash
# Check which service is consuming resources
docker stats

# Restart service
docker-compose -f docker-compose.prod.yml restart [service-name]
```

**SSL Certificate Expiring**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Copy new certificate
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Updates & Upgrades

### Update Application

```bash
# Pull latest changes
git pull origin main

# Run update script
./scripts/deploy-update.sh

# Or manually:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## Security Best Practices

1. **Change Default Passwords**
   - Django superuser password
   - Database password
   - Redis password
   - MikroTik router credentials

2. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Fail2Ban for Brute Force Protection**
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular Backups**
   - Daily database backups (automated)
   - Weekly full system backups
   - Test restore procedures monthly

5. **Monitor Logs**
   - Check nginx error logs regularly
   - Monitor Django application logs
   - Set up log aggregation for production

6. **Keep System Updated**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   docker system prune  # Remove unused images/containers
   ```

## Performance Tuning

### Database Optimization
```bash
# Analyze and optimize database
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin -c "VACUUM ANALYZE;"
```

### Nginx Caching
Edit `nginx.prod.conf` to enable caching for static files (already configured).

### Celery Worker Tuning
Adjust worker concurrency in `docker-compose.prod.yml`:
- Increase `--concurrency` for more parallel tasks
- Decrease for lower resource usage

## Disaster Recovery

### Restore Full System from Backup

```bash
# 1. Restore database
./scripts/restore-db.sh backups/latest_backup.sql.gz

# 2. Restart all services
docker-compose -f docker-compose.prod.yml restart

# 3. Verify
./scripts/health-check.sh
```

## Support & Troubleshooting

### Logs Location
- Docker Compose: `docker-compose logs [service]`
- Application: `/opt/isp-admin/backend/logs/`
- Nginx: `docker logs isp_admin_nginx`
- Database: `docker logs isp_admin_db`

### Useful Commands

```bash
# SSH into container
docker-compose -f docker-compose.prod.yml exec backend bash

# Run Django management command
docker-compose -f docker-compose.prod.yml exec backend python manage.py [command]

# View database
docker-compose -f docker-compose.prod.yml exec db psql -U isp_admin isp_admin

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli info

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Scaling Considerations

For larger deployments (1000+ users):

1. **Load Balancing**: Use HAProxy or AWS ELB
2. **Database**: Consider managed PostgreSQL (RDS, Cloud SQL)
3. **Redis**: Use managed Redis (ElastiCache, Memorystore)
4. **Storage**: Use S3/GCS for media files
5. **CDN**: CloudFront/CloudFlare for static assets
6. **Monitoring**: Prometheus + Grafana for metrics

## Next Steps

1. Configure monitoring alerts
2. Set up log aggregation
3. Plan disaster recovery procedures
4. Document custom configurations
5. Schedule regular backup testing
6. Configure CI/CD pipeline for deployments
