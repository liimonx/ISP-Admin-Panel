# Production Deployment Checklist

## Pre-Deployment ✓

- [ ] **Infrastructure**
  - [ ] Server provisioned (2+ CPU, 4GB+ RAM, 50GB+ SSD)
  - [ ] Ubuntu 20.04+ or CentOS 8+ installed
  - [ ] Docker and Docker Compose installed
  - [ ] SSH key pair generated for GitHub Actions
  - [ ] Server firewall configured (allow 22, 80, 443)

- [ ] **Domain & SSL**
  - [ ] Domain registered and DNS configured
  - [ ] SSL certificate obtained (Let's Encrypt recommended)
  - [ ] Certificate placed in `ssl/` directory
  - [ ] Certificate renewal strategy planned

- [ ] **Configuration**
  - [ ] `.env.prod` created from `.env.prod.example`
  - [ ] `SECRET_KEY` generated and configured
  - [ ] Database password set to strong value
  - [ ] Redis password set to strong value
  - [ ] `ALLOWED_HOSTS` updated with domain names
  - [ ] MikroTik router credentials configured
  - [ ] Email provider credentials configured
  - [ ] Payment provider keys configured (if applicable)

- [ ] **Repository**
  - [ ] Code pushed to GitHub `main` branch
  - [ ] GitHub Actions secrets configured:
    - [ ] `DEPLOY_HOST`
    - [ ] `DEPLOY_USER`
    - [ ] `DEPLOY_KEY`
    - [ ] `SLACK_WEBHOOK` (optional)

## Deployment Phase

- [ ] **Run Deployment Script**
  ```bash
  chmod +x deploy.sh
  ./deploy.sh
  ```

- [ ] **Verify Services**
  - [ ] All containers running: `docker-compose -f docker-compose.prod.yml ps`
  - [ ] No errors in logs: `docker-compose -f docker-compose.prod.yml logs`
  - [ ] Health check passes: `./scripts/health-check.sh`

- [ ] **Access Applications**
  - [ ] [ ] Frontend loads: https://yourdomain.com
  - [ ] [ ] Admin panel accessible: https://yourdomain.com/admin/
  - [ ] [ ] API docs available: https://yourdomain.com/api/schema/swagger/
  - [ ] [ ] Backend health endpoint: https://yourdomain.com/health/

## Post-Deployment Configuration

- [ ] **Security Hardening**
  - [ ] Change Django superuser password
  - [ ] Configure firewall rules
  - [ ] Install Fail2Ban for brute force protection
  - [ ] Setup SSH key-only authentication
  - [ ] Disable root login

- [ ] **Monitoring & Logging**
  - [ ] Configure log rotation
  - [ ] Setup alerts for high CPU/memory
  - [ ] Configure uptime monitoring
  - [ ] Setup error logging/notification
  - [ ] Enable Docker logging

- [ ] **Backups**
  - [ ] Configure automated daily backups
  - [ ] Add backup script to crontab: `0 2 * * * /opt/isp-admin/scripts/backup-db.sh`
  - [ ] Test restore procedure
  - [ ] Store backups in secure location

- [ ] **DNS & CDN**
  - [ ] Point DNS A record to server IP
  - [ ] Configure CNAME for www subdomain
  - [ ] Setup CDN for static assets (optional)
  - [ ] Verify DNS propagation

- [ ] **SSL Certificate Auto-Renewal**
  - [ ] Install certbot
  - [ ] Setup cron job for renewal: `0 0 1 * * certbot renew --quiet`
  - [ ] Verify certificate auto-renewal

- [ ] **Performance Tuning**
  - [ ] Monitor resource usage
  - [ ] Adjust worker/concurrency settings if needed
  - [ ] Enable database connection pooling
  - [ ] Configure caching headers

## Testing & Validation

- [ ] **Functionality Testing**
  - [ ] User authentication works
  - [ ] Create/read/update customer records
  - [ ] Generate invoices
  - [ ] Celery tasks execute properly
  - [ ] Email notifications send correctly
  - [ ] Payment processing (if configured)
  - [ ] Router API connectivity

- [ ] **Performance Testing**
  - [ ] API response times acceptable
  - [ ] Load test (Apache Bench or k6)
  - [ ] Database query performance
  - [ ] Static file delivery speed

- [ ] **Security Testing**
  - [ ] HTTPS enforced (HTTP redirects)
  - [ ] Security headers present
  - [ ] CSRF protection enabled
  - [ ] SQL injection protection verified
  - [ ] XSS protection enabled
  - [ ] Rate limiting active

- [ ] **Availability Testing**
  - [ ] Services restart on failure
  - [ ] Database backups work
  - [ ] Restore from backup succeeds
  - [ ] Health check endpoint works

## Monitoring Setup

- [ ] **Application Monitoring**
  ```bash
  # View logs
  docker-compose -f docker-compose.prod.yml logs -f

  # Run health check
  ./scripts/health-check.sh

  # Monitor resources
  docker stats
  ```

- [ ] **Alerting Configuration**
  - [ ] High CPU usage alert
  - [ ] High memory usage alert
  - [ ] Disk space alert
  - [ ] Service down alert
  - [ ] Database backup failure alert

- [ ] **Uptime Monitoring**
  - [ ] Configure status page monitoring
  - [ ] Setup endpoint monitoring
  - [ ] Configure notification channels

## Documentation

- [ ] **Deployment Documentation**
  - [ ] Document custom configurations
  - [ ] Document network topology
  - [ ] Document backup procedures
  - [ ] Document access credentials (securely)
  - [ ] Document troubleshooting steps

- [ ] **Operations Procedures**
  - [ ] Document how to restart services
  - [ ] Document how to update application
  - [ ] Document how to restore from backup
  - [ ] Document how to scale services
  - [ ] Document incident response procedures

## First Week Monitoring

- [ ] **Day 1**
  - [ ] Monitor logs closely
  - [ ] Verify all background tasks running
  - [ ] Check database growth
  - [ ] Monitor error rates

- [ ] **Days 2-3**
  - [ ] Verify nightly backup completes
  - [ ] Monitor average response times
  - [ ] Check email delivery
  - [ ] Verify router connectivity

- [ ] **Days 4-7**
  - [ ] Review security logs
  - [ ] Check resource utilization patterns
  - [ ] Verify SSL certificate
  - [ ] Test disaster recovery

## Maintenance Schedule

### Daily
- [ ] Check logs for errors
- [ ] Verify all services running
- [ ] Monitor disk space
- [ ] Confirm backups completed

### Weekly
- [ ] Review security logs
- [ ] Analyze performance metrics
- [ ] Check certificate expiration date
- [ ] Test monitoring alerts

### Monthly
- [ ] Test disaster recovery procedures
- [ ] Review and optimize database
- [ ] Update Docker images
- [ ] Analyze traffic patterns

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Compliance review

## Troubleshooting Guide

### If Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Verify environment variables
cat .env.prod | grep -v "^#"
```

### If Database Connection Fails
```bash
# Check database container
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test connection
docker-compose -f docker-compose.prod.yml exec db pg_isready -U isp_admin
```

### If High Memory Usage
```bash
# Check which container
docker stats

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service]

# Clear Docker cache
docker system prune
```

### If SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in ssl/cert.pem -text -noout

# Renew certificate
sudo certbot renew

# Copy to ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Emergency Procedures

### Rollback to Previous Version
```bash
# Pull specific image version
docker-compose -f docker-compose.prod.yml down
docker pull ghcr.io/username/repo/backend:previous-sha
docker-compose -f docker-compose.prod.yml up -d
```

### Restore from Backup
```bash
./scripts/restore-db.sh backups/isp_admin_YYYYMMDD_HHMMSS.sql.gz
```

### Contact Escalation Path
1. Infrastructure admin: [contact info]
2. Database admin: [contact info]
3. DevOps on-call: [contact info]
4. CTO: [contact info]

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Sign-off By**: _______________
**Notes**: _______________
