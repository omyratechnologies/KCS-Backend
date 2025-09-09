# KCS Backend Manual Deployment Guide

This guide will help you deploy the KCS Backend application manually on Ubuntu without Docker.

## Prerequisites

- Ubuntu 20.04+ server
- Root or sudo access
- Domain name pointing to your server (api.letscatchup-kcs.com)

## Quick Deployment

### 1. Initial Server Setup

```bash
# Upload the setup script and make it executable
chmod +x setup-environment.sh
./setup-environment.sh
```

### 2. Clone and Prepare Application

```bash
# Clone the repository
git clone <your-repo-url> ~/KCS-Backend
cd ~/KCS-Backend

# Copy environment variables
cp .env.example .env  # Edit with your actual values
nano .env
```

### 3. Deploy Application

```bash
# Make deployment script executable
chmod +x deploy-manual.sh

# Run full deployment
./deploy-manual.sh
```

## Alternative Deployment Methods

### Using SystemD (Recommended)
The default deployment uses SystemD service management:

```bash
# Deploy with SystemD
./deploy-manual.sh

# Manage service
sudo systemctl start kcs-backend
sudo systemctl stop kcs-backend
sudo systemctl restart kcs-backend
sudo systemctl status kcs-backend

# View logs
sudo journalctl -u kcs-backend -f
```

### Using PM2 (Alternative)
If you prefer PM2 process management:

```bash
# Install dependencies
bun install

# Start with PM2
pm2 start ecosystem.config.json

# Manage with PM2
pm2 status
pm2 restart kcs-backend
pm2 stop kcs-backend
pm2 logs kcs-backend
```

## Monitoring and Maintenance

### Check System Status
```bash
# Run monitoring script
./monitor-kcs.sh

# Check specific services
sudo systemctl status kcs-backend
sudo systemctl status nginx
```

### View Logs
```bash
# Application logs
sudo journalctl -u kcs-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart application
./deploy-manual.sh restart

# Or individual services
sudo systemctl restart kcs-backend
sudo systemctl reload nginx
```

## File Structure

```
~/KCS-Backend/
├── deploy-manual.sh           # Main deployment script
├── setup-environment.sh       # Environment setup script
├── kcs-backend.service        # SystemD service file
├── nginx-manual.conf          # Nginx configuration
├── ecosystem.config.json      # PM2 configuration
├── monitor-kcs.sh            # Monitoring script (created during setup)
└── src/                      # Application source code
```

## Troubleshooting

### Application Won't Start
1. Check service status: `sudo systemctl status kcs-backend`
2. Check logs: `sudo journalctl -u kcs-backend -n 50`
3. Verify environment variables in `.env`
4. Check if ports 4500 and 4501 are available: `netstat -tulpn | grep -E '4500|4501'`

### Nginx Issues
1. Test configuration: `sudo nginx -t`
2. Check nginx status: `sudo systemctl status nginx`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Port Conflicts
1. Check what's using ports: `sudo netstat -tulpn | grep -E '4500|4501|80'`
2. Kill conflicting processes: `sudo pkill -f <process-name>`

### Database Connection Issues
1. Verify database credentials in `.env`
2. Check network connectivity to database
3. Review application logs for specific error messages

## Environment Variables

Make sure to set these in your `.env` file:

```bash
NODE_ENV=production
PORT=4500
SOCKET_PORT=4501

# Database configuration
DB_HOST=your-couchbase-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Redis configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# Other required environment variables
# (Add your specific variables here)
```

## Security Considerations

1. **Firewall**: The setup script configures UFW to allow only necessary ports
2. **SSL**: Enable HTTPS in nginx configuration when you have SSL certificates
3. **Environment**: Never commit `.env` files with sensitive data
4. **Updates**: Regularly update system packages and dependencies

## Performance Optimization

1. **Process Management**: Consider using PM2 with cluster mode for multiple instances
2. **Nginx**: Enable gzip compression and static file caching
3. **Database**: Optimize database connections and queries
4. **Monitoring**: Set up proper monitoring and alerting

## Support

If you encounter issues:

1. Check the monitoring script: `./monitor-kcs.sh`
2. Review logs: `sudo journalctl -u kcs-backend -n 100`
3. Verify all services are running: `sudo systemctl status kcs-backend nginx`
4. Test network connectivity and port availability
