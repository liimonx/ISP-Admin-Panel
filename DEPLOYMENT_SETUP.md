# Deployment Configuration

## Quick Start (5 minutes)

```bash
# 1. Copy production environment
cp .env.prod.example .env.prod

# 2. Edit configuration
nano .env.prod

# 3. Run deployment
./deploy.sh
```

## File Structure

```
├── docker-compose.prod.yml       # Production compose configuration
├── nginx.prod.conf                # Production nginx config
├── .env.prod.example              # Environment variables template
├── deploy.sh                       # Main deployment script
├── DEPLOYMENT.md                   # Detailed deployment guide
└── scripts/
    ├── backup-db.sh               # Database backup script
    ├── restore-db.sh              # Database restore script
    ├── deploy-update.sh            # Update deployment script
    └── health-check.sh             # Health check script
```

## Key Configuration Files

### docker-compose.prod.yml
Production-optimized compose file with:
- Health checks for all services
- Resource limits
- Logging configuration
- Named volumes for data persistence
- Production-specific environment variables

### nginx.prod.conf
Production nginx configuration with:
- SSL/TLS support
- Security headers
- Rate limiting
- Gzip compression
- Caching strategies

### .env.prod
Production environment variables - **MUST be edited before deployment**

## GitHub Actions Workflow

The `.github/workflows/deploy-prod.yml` workflow:
1. Builds Docker images on push to main
2. Pushes to GitHub Container Registry
3. SSHes into production server
4. Pulls latest code and images
5. Runs migrations and collects static files
6. Notifies via Slack

**Setup required:**
- `DEPLOY_HOST`: Production server IP/domain
- `DEPLOY_USER`: SSH user
- `DEPLOY_KEY`: SSH private key
- `SLACK_WEBHOOK`: (optional) Slack notification webhook

## Common Operations

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f [service]
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Database Backup
```bash
./scripts/backup-db.sh
```

### Health Check
```bash
./scripts/health-check.sh
```

### Update Application
```bash
./scripts/deploy-update.sh
```

## Next Steps

1. **Update environment variables in .env.prod**
   - Generate strong SECRET_KEY
   - Set database and Redis passwords
   - Configure router settings
   - Add email credentials

2. **Prepare SSL certificates**
   - Use Let's Encrypt (recommended)
   - Place in `ssl/` directory

3. **Update nginx.prod.conf**
   - Replace domain names
   - Configure SSL paths if needed

4. **Run deployment**
   ```bash
   ./deploy.sh
   ```

5. **Configure backups**
   - Add to crontab: `0 2 * * * /path/to/scripts/backup-db.sh`

6. **Setup monitoring**
   - Configure health checks
   - Setup log aggregation
   - Configure alerts

See DEPLOYMENT.md for detailed instructions.
