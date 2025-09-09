#!/bin/bash

# KCS Backend Environment Setup Script
# This script prepares the Ubuntu server for manual deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Update system packages
update_system() {
    log_step "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
}

# Install required system packages
install_system_packages() {
    log_step "Installing system packages..."
    sudo apt install -y \
        curl \
        wget \
        git \
        unzip \
        nginx \
        htop \
        tree \
        jq \
        build-essential \
        software-properties-common
}

# Install Bun
install_bun() {
    log_step "Installing Bun JavaScript runtime..."
    
    if command -v bun &> /dev/null; then
        log_info "Bun is already installed: $(bun --version)"
        return 0
    fi
    
    # Install Bun
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Add Bun to PATH permanently
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
    
    # Verify installation
    if command -v bun &> /dev/null; then
        log_info "Bun installed successfully: $(bun --version)"
    else
        log_error "Failed to install Bun"
        exit 1
    fi
}

# Configure firewall
configure_firewall() {
    log_step "Configuring firewall..."
    
    # Install ufw if not installed
    sudo apt install -y ufw
    
    # Reset firewall rules
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    sudo ufw allow 22
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Allow development port
    sudo ufw allow 8080
    
    # Enable firewall
    sudo ufw --force enable
    
    log_info "Firewall configured with the following rules:"
    sudo ufw status
}

# Configure nginx
configure_nginx() {
    log_step "Configuring Nginx..."
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Create nginx log directory for the app
    sudo mkdir -p /var/log/nginx/kcs-backend
    
    log_info "Nginx configured and started."
}

# Create application directories
create_app_directories() {
    log_step "Creating application directories..."
    
    # Create logs directory
    mkdir -p ~/logs
    
    # Create backup directory
    mkdir -p ~/backups
    
    log_info "Application directories created."
}

# Install PM2 as an alternative process manager
install_pm2() {
    log_step "Installing PM2 process manager (alternative to systemd)..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 is already installed"
        return 0
    fi
    
    # Install PM2 globally with bun
    bun install -g pm2
    
    # Setup PM2 startup script
    pm2 startup systemd -u $USER --hp $HOME
    
    log_info "PM2 installed successfully"
}

# Setup log rotation
setup_log_rotation() {
    log_step "Setting up log rotation..."
    
    # Create logrotate configuration for KCS Backend
    sudo tee /etc/logrotate.d/kcs-backend > /dev/null <<EOF
/var/log/kcs-backend/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        systemctl reload kcs-backend 2>/dev/null || true
    endscript
}
EOF
    
    log_info "Log rotation configured."
}

# Create monitoring script
create_monitoring_script() {
    log_step "Creating monitoring script..."
    
    cat > ~/monitor-kcs.sh << 'EOF'
#!/bin/bash

# KCS Backend Monitoring Script

check_service() {
    if systemctl is-active --quiet kcs-backend; then
        echo "✅ KCS Backend service is running"
    else
        echo "❌ KCS Backend service is not running"
        systemctl status kcs-backend --no-pager -l
    fi
}

check_nginx() {
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
        systemctl status nginx --no-pager -l
    fi
}

check_ports() {
    echo "📊 Port Status:"
    echo "  Port 4500 (API): $(netstat -ln | grep ':4500 ' > /dev/null && echo 'Open' || echo 'Closed')"
    echo "  Port 4501 (WebSocket): $(netstat -ln | grep ':4501 ' > /dev/null && echo 'Open' || echo 'Closed')"
    echo "  Port 80 (HTTP): $(netstat -ln | grep ':80 ' > /dev/null && echo 'Open' || echo 'Closed')"
}

show_resources() {
    echo "💾 System Resources:"
    echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4"%"}')"
    echo "  Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%\n", $3/$2 * 100.0)}')"
    echo "  Disk Usage: $(df -h / | awk 'NR==2{printf "%s\n", $5}')"
}

show_recent_logs() {
    echo "📝 Recent Logs (last 10 lines):"
    journalctl -u kcs-backend -n 10 --no-pager
}

echo "🔍 KCS Backend System Monitor"
echo "=============================="
check_service
check_nginx
check_ports
show_resources
echo
show_recent_logs
EOF
    
    chmod +x ~/monitor-kcs.sh
    log_info "Monitoring script created at ~/monitor-kcs.sh"
}

# Main setup process
main() {
    log_info "Starting KCS Backend environment setup for Ubuntu..."
    echo
    
    update_system
    install_system_packages
    install_bun
    configure_firewall
    configure_nginx
    create_app_directories
    install_pm2
    setup_log_rotation
    create_monitoring_script
    
    echo
    log_info "🎉 Environment setup completed successfully!"
    echo
    log_info "Next steps:"
    log_info "1. Clone your KCS Backend repository to ~/KCS-Backend"
    log_info "2. Copy your environment variables (.env file)"
    log_info "3. Run the deployment script: ./deploy-manual.sh"
    echo
    log_info "Useful files created:"
    log_info "  - ~/monitor-kcs.sh (system monitoring)"
    log_info "  - Log rotation configured in /etc/logrotate.d/kcs-backend"
    echo
    log_info "System Information:"
    log_info "  - Bun version: $(bun --version)"
    log_info "  - Nginx status: $(systemctl is-active nginx)"
    log_info "  - PM2 status: $(command -v pm2 && echo "Installed" || echo "Not available")"
    echo
    log_warn "Please restart your shell session or run 'source ~/.bashrc' to update PATH"
}

main "$@"
