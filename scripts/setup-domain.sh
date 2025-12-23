#!/bin/bash

#######################################################
# Domain Setup Script for etl.p1lending.io
#######################################################
#
# This script automates the setup of:
# - Nginx reverse proxy configuration
# - SSL/TLS certificate via Let's Encrypt
# - Application environment updates
#
# Prerequisites:
# - DNS A record pointing to this server
# - Nginx installed
# - Docker and Docker Compose installed
# - Application deployed
#
# Usage:
#   sudo ./scripts/setup-domain.sh [EMAIL_FOR_SSL]
#
# Example:
#   sudo ./scripts/setup-domain.sh ahmad@priority1lending.io
#
#######################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="etl.p1lending.io"
NGINX_CONF_NAME="etl.p1lending.io"
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_CONF_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_CONF_NAME}"
CERTBOT_EMAIL="${1}"

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Check if email is provided
if [ -z "$CERTBOT_EMAIL" ]; then
    print_error "Email address for SSL certificate is required"
    echo "Usage: sudo ./scripts/setup-domain.sh your-email@example.com"
    exit 1
fi

print_header "P1Lending ETL - Domain Setup"
echo "Domain: $DOMAIN"
echo "SSL Email: $CERTBOT_EMAIL"
echo ""

# Step 1: Verify DNS
print_header "Step 1: Verifying DNS Configuration"

print_info "Checking DNS resolution for $DOMAIN..."
if host "$DOMAIN" > /dev/null 2>&1; then
    SERVER_IP=$(host "$DOMAIN" | grep "has address" | awk '{print $4}' | head -1)
    print_success "DNS resolved: $DOMAIN → $SERVER_IP"
else
    print_error "DNS resolution failed for $DOMAIN"
    print_warning "Please configure DNS A record pointing to this server's IP"
    print_info "Run: nslookup $DOMAIN"
    exit 1
fi

# Step 2: Check prerequisites
print_header "Step 2: Checking Prerequisites"

# Check Nginx
if command -v nginx > /dev/null 2>&1; then
    print_success "Nginx is installed: $(nginx -v 2>&1 | cut -d'/' -f2)"
else
    print_error "Nginx is not installed"
    print_info "Installing Nginx..."
    apt update && apt install nginx -y
    print_success "Nginx installed successfully"
fi

# Check Certbot
if command -v certbot > /dev/null 2>&1; then
    print_success "Certbot is installed: $(certbot --version 2>&1 | head -1)"
else
    print_error "Certbot is not installed"
    print_info "Installing Certbot..."
    apt install certbot python3-certbot-nginx -y
    print_success "Certbot installed successfully"
fi

# Check Docker
if command -v docker > /dev/null 2>&1; then
    print_success "Docker is installed: $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Step 3: Deploy Nginx configuration
print_header "Step 3: Deploying Nginx Configuration"

# Check if config file exists in repo
REPO_NGINX_CONF="nginx/etl.p1lending.io.conf"
if [ ! -f "$REPO_NGINX_CONF" ]; then
    print_error "Nginx config file not found: $REPO_NGINX_CONF"
    exit 1
fi

# Copy configuration
print_info "Copying Nginx configuration..."
cp "$REPO_NGINX_CONF" "$NGINX_AVAILABLE"
print_success "Configuration copied to $NGINX_AVAILABLE"

# Create symbolic link
if [ -L "$NGINX_ENABLED" ]; then
    print_warning "Site already enabled, removing old link..."
    rm "$NGINX_ENABLED"
fi

ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
print_success "Site enabled: $NGINX_ENABLED"

# Remove default site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    print_info "Removing default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if nginx -t > /dev/null 2>&1; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    nginx -t
    exit 1
fi

# Reload Nginx
print_info "Reloading Nginx..."
systemctl reload nginx
print_success "Nginx reloaded successfully"

# Step 4: Verify application is running
print_header "Step 4: Verifying Application Status"

# Check if frontend container is running
if docker ps | grep -q "frontend"; then
    print_success "Frontend container is running (port 3000)"
else
    print_warning "Frontend container not found"
    print_info "Starting application..."
    docker-compose -f docker-compose.prod.yml up -d frontend
fi

# Check if backend container is running
if docker ps | grep -q "backend"; then
    print_success "Backend container is running (port 8000)"
else
    print_warning "Backend container not found"
    print_info "Starting application..."
    docker-compose -f docker-compose.prod.yml up -d backend
fi

# Wait for containers to be healthy
print_info "Waiting for services to be ready..."
sleep 5

# Test HTTP access
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health" | grep -q "200"; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    print_info "Check backend logs: docker-compose -f docker-compose.prod.yml logs backend"
fi

# Step 5: Obtain SSL certificate
print_header "Step 5: Obtaining SSL Certificate"

print_info "Running Certbot for domain: $DOMAIN"
print_info "This will:"
print_info "  1. Obtain SSL certificate from Let's Encrypt"
print_info "  2. Modify Nginx config to enable HTTPS"
print_info "  3. Set up HTTP → HTTPS redirect"

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificate already exists for $DOMAIN"
    read -p "Do you want to renew it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        certbot --nginx -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --force-renewal
    else
        print_info "Skipping certificate renewal"
    fi
else
    # Run Certbot
    certbot --nginx -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --redirect

    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        print_info "Manual troubleshooting required"
        exit 1
    fi
fi

# Verify certificate
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d'=' -f2)
    print_success "Certificate expires: $CERT_EXPIRY"
fi

# Step 6: Update application environment
print_header "Step 6: Updating Application Environment"

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    print_warning ".env file not found"
    print_info "Skipping environment update"
else
    print_info "Updating CORS and domain settings..."

    # Backup .env
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

    # Update CORS origins if not already set
    if grep -q "BACKEND_CORS_ORIGINS" "$ENV_FILE"; then
        print_info "BACKEND_CORS_ORIGINS already configured"
    else
        echo "" >> "$ENV_FILE"
        echo "# Domain Configuration (added by setup-domain.sh)" >> "$ENV_FILE"
        echo 'BACKEND_CORS_ORIGINS=["https://etl.p1lending.io","http://localhost:3000"]' >> "$ENV_FILE"
        print_success "Added BACKEND_CORS_ORIGINS to .env"
    fi

    # Restart backend to apply changes
    print_info "Restarting backend container..."
    docker-compose -f docker-compose.prod.yml restart backend
    print_success "Backend restarted"
fi

# Step 7: Verify HTTPS access
print_header "Step 7: Verification"

sleep 3

# Test HTTPS
print_info "Testing HTTPS access..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" | grep -q "200"; then
    print_success "HTTPS health check passed"
else
    print_error "HTTPS health check failed"
fi

# Test HTTP redirect
print_info "Testing HTTP → HTTPS redirect..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")
if [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    print_success "HTTP redirects to HTTPS"
else
    print_warning "HTTP redirect status: $HTTP_CODE (expected 301/302)"
fi

# SSL Labs check
print_info "For detailed SSL analysis, visit:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"

# Step 8: Final instructions
print_header "Setup Complete! 🎉"

echo -e "${GREEN}Your application is now accessible at:${NC}"
echo -e "  ${BLUE}https://$DOMAIN${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Test the application in your browser"
echo "  2. Verify login functionality"
echo "  3. Test ETL job execution"
echo "  4. Check WebSocket connections (real-time updates)"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  • SSL renewal: Automatic (certbot timer)"
echo "  • Check renewal: sudo certbot renew --dry-run"
echo "  • Nginx logs: /var/log/nginx/etl.p1lending.io.*.log"
echo "  • App logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo -e "${YELLOW}Maintenance:${NC}"
echo "  • Nginx reload: sudo systemctl reload nginx"
echo "  • Check certificate: sudo certbot certificates"
echo "  • Force renewal: sudo certbot renew --force-renewal"
echo ""

print_success "Domain setup completed successfully!"
