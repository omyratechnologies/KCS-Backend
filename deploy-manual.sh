#!/bin/bash

# KCS Backend Manual Deployment Script
# This script handles the complete deployment process without Docker

set -e  # Exit on any error

# Configuration
SERVICE_NAME="kcs-backend"
APP_DIR="/home/ubuntu/KCS-Backend"
NGINX_CONFIG="nginx-manual.conf"
USER="ubuntu"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if bun is installed
    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed. Please install Bun first."
        exit 1
    fi
    
    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx is not installed. Please install nginx first."
        exit 1
    fi
    
    # Check if systemctl is available
    if ! command -v systemctl &> /dev/null; then
        log_error "systemctl is not available. This script requires systemd."
        exit 1
    fi
    
    log_info "All requirements satisfied."
}

install_dependencies() {
    log_info "Installing application dependencies..."
    cd "$APP_DIR"
    bun install
}

setup_systemd_service() {
    log_info "Setting up systemd service..."
    
    # Copy service file to systemd directory
    sudo cp "$APP_DIR/$SERVICE_NAME.service" "/etc/systemd/system/"
    
    # Reload systemd daemon
    sudo systemctl daemon-reload
    
    # Enable the service
    sudo systemctl enable "$SERVICE_NAME"
    
    log_info "Systemd service configured."
}

setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    # Backup existing nginx config if it exists
    if [ -f "/etc/nginx/sites-available/kcs-backend" ]; then
        sudo cp "/etc/nginx/sites-available/kcs-backend" "/etc/nginx/sites-available/kcs-backend.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "Existing nginx configuration backed up."
    fi
    
    # Copy nginx configuration
    sudo cp "$APP_DIR/$NGINX_CONFIG" "/etc/nginx/sites-available/kcs-backend"
    
    # Create symlink to sites-enabled
    sudo ln -sf "/etc/nginx/sites-available/kcs-backend" "/etc/nginx/sites-enabled/kcs-backend"
    
    # Remove default nginx site if it exists
    sudo rm -f "/etc/nginx/sites-enabled/default"
    
    # Test nginx configuration
    if sudo nginx -t; then
        log_info "Nginx configuration is valid."
    else
        log_error "Nginx configuration is invalid. Please check the configuration."
        exit 1
    fi
    
    # Reload nginx
    sudo systemctl reload nginx
    
    log_info "Nginx configuration updated."
}

create_log_directory() {
    log_info "Creating log directory..."
    sudo mkdir -p /var/log/kcs-backend
    sudo chown $USER:$USER /var/log/kcs-backend
}

start_services() {
    log_info "Starting services..."
    
    # Start the application service
    sudo systemctl start "$SERVICE_NAME"
    
    # Check if service is running
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log_info "KCS Backend service started successfully."
    else
        log_error "Failed to start KCS Backend service."
        sudo systemctl status "$SERVICE_NAME"
        exit 1
    fi
    
    # Ensure nginx is running
    sudo systemctl start nginx
    
    if sudo systemctl is-active --quiet nginx; then
        log_info "Nginx is running."
    else
        log_error "Failed to start nginx."
        exit 1
    fi
}

show_status() {
    log_info "Checking service status..."
    echo
    echo "=== KCS Backend Service Status ==="
    sudo systemctl status "$SERVICE_NAME" --no-pager -l
    echo
    echo "=== Nginx Status ==="
    sudo systemctl status nginx --no-pager -l
    echo
    echo "=== Application Logs (last 20 lines) ==="
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
}

# Main deployment process
main() {
    log_info "Starting KCS Backend manual deployment..."
    
    check_requirements
    install_dependencies
    create_log_directory
    setup_systemd_service
    setup_nginx
    start_services
    
    log_info "Deployment completed successfully!"
    echo
    log_info "Your application should now be accessible at:"
    log_info "  - HTTP: http://devapi.letscatchup-kcs.com"
    log_info "  - Development: http://your-server-ip:8080"
    echo
    log_info "Useful commands:"
    log_info "  - View logs: sudo journalctl -u $SERVICE_NAME -f"
    log_info "  - Restart service: sudo systemctl restart $SERVICE_NAME"
    log_info "  - Stop service: sudo systemctl stop $SERVICE_NAME"
    log_info "  - Service status: sudo systemctl status $SERVICE_NAME"
    
    show_status
}

# Handle script arguments
case "$1" in
    "start")
        start_services
        ;;
    "stop")
        log_info "Stopping services..."
        sudo systemctl stop "$SERVICE_NAME"
        ;;
    "restart")
        log_info "Restarting services..."
        sudo systemctl restart "$SERVICE_NAME"
        sudo systemctl reload nginx
        ;;
    "status")
        show_status
        ;;
    "logs")
        sudo journalctl -u "$SERVICE_NAME" -f
        ;;
    "deploy" | "")
        main
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|status|logs}"
        echo
        echo "Commands:"
        echo "  deploy  - Full deployment process (default)"
        echo "  start   - Start services"
        echo "  stop    - Stop services"
        echo "  restart - Restart services"
        echo "  status  - Show service status"
        echo "  logs    - Show live logs"
        exit 1
        ;;
esac
