#!/bin/bash

# EC2 Instance Setup Script
# Run this script on your EC2 instance to prepare it for deployment

set -e

echo "🚀 Setting up EC2 instance for KCS Backend deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully"
else
    echo "Docker is already installed"
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose is already installed"
fi

# Install essential tools
echo "🛠️ Installing essential tools..."
sudo apt install -y curl wget git htop nginx-utils certbot

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 4500/tcp  # API port
sudo ufw allow 4501/tcp  # Socket.IO port
sudo ufw allow 6379/tcp  # Redis port (if external access needed)
sudo ufw allow 8091:8096/tcp # Couchbase ports (if external access needed)

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/kcs-backend
sudo chown -R $USER:$USER /opt/kcs-backend

# Create logs directory
sudo mkdir -p /var/log/kcs-backend
sudo chown -R $USER:$USER /var/log/kcs-backend

# Set up log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/kcs-backend > /dev/null <<EOF
/var/log/kcs-backend/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        /usr/bin/docker-compose -f /opt/kcs-backend/docker-compose.prod.yml restart nginx 2>/dev/null || true
    endscript
}
EOF

# Install monitoring tools
echo "📊 Installing monitoring tools..."
# Install Node Exporter for Prometheus monitoring (optional)
if [ ! -d "/opt/node_exporter" ]; then
    cd /tmp
    wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
    tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
    sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
    sudo useradd --no-create-home --shell /bin/false node_exporter
    sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
    
    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable node_exporter
    sudo systemctl start node_exporter
    echo "Node Exporter installed and started"
fi

# Configure swap (recommended for memory-limited instances)
echo "💾 Configuring swap..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap file created and enabled"
else
    echo "Swap file already exists"
fi

# Optimize system settings
echo "⚡ Optimizing system settings..."
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# KCS Backend optimizations
vm.max_map_count=262144
fs.file-max=65536
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
EOF

sudo sysctl -p

# Create backup script
echo "💾 Creating backup script..."
sudo tee /usr/local/bin/kcs-backup.sh > /dev/null <<'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/kcs-backend"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Docker volumes
echo "Creating backup for $DATE..."

# Backup Couchbase data
docker run --rm -v kcs-backend_couchbase_data:/source:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/couchbase_$DATE.tar.gz -C /source .

# Backup Redis data
docker run --rm -v kcs-backend_redis_data:/source:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/redis_$DATE.tar.gz -C /source .

# Backup application uploads
docker run --rm -v kcs-backend_app_uploads:/source:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz -C /source .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/kcs-backup.sh

# Set up daily backup cron job
echo "0 2 * * * /usr/local/bin/kcs-backup.sh >> /var/log/kcs-backup.log 2>&1" | sudo crontab -

# Create health check script
sudo tee /usr/local/bin/kcs-health-check.sh > /dev/null <<'EOF'
#!/bin/bash

API_URL="http://localhost:4500/api/health"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

check_health() {
    if curl -f -s "$API_URL" > /dev/null; then
        return 0
    else
        return 1
    fi
}

if ! check_health; then
    echo "$(date): Health check failed for KCS Backend" | tee -a /var/log/kcs-health.log
    
    # Try to restart the application
    cd /opt/kcs-backend
    docker-compose -f docker-compose.prod.yml restart api
    
    sleep 30
    
    if ! check_health; then
        echo "$(date): Application restart failed" | tee -a /var/log/kcs-health.log
        
        # Send alert to Slack (if webhook is configured)
        if [ ! -z "$SLACK_WEBHOOK" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data '{"text":"🚨 KCS Backend health check failed on '$(hostname)'. Manual intervention required."}' \
                "$SLACK_WEBHOOK"
        fi
    else
        echo "$(date): Application restarted successfully" | tee -a /var/log/kcs-health.log
    fi
fi
EOF

sudo chmod +x /usr/local/bin/kcs-health-check.sh

# Set up health check cron job (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/kcs-health-check.sh" | sudo crontab -

# Display system information
echo "📋 System Information:"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Memory: $(free -h | grep ^Mem | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $2}')"
echo "CPU: $(nproc) cores"

echo "✅ EC2 instance setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure GitHub Secrets with your environment variables"
echo "2. Push your code to trigger the deployment workflow"
echo "3. Monitor the deployment in GitHub Actions"
echo ""
echo "Important commands:"
echo "- View logs: sudo docker-compose -f /opt/kcs-backend/docker-compose.prod.yml logs -f"
echo "- Restart app: sudo docker-compose -f /opt/kcs-backend/docker-compose.prod.yml restart"
echo "- Create backup: /usr/local/bin/kcs-backup.sh"
echo "- Check health: /usr/local/bin/kcs-health-check.sh"
