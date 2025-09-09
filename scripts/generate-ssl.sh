#!/bin/bash

# Generate self-signed SSL certificates for nginx
# This is suitable for Cloudflare Origin CA setup

# Create directories
mkdir -p /etc/ssl/certs /etc/ssl/private

# Generate private key
openssl genrsa -out /etc/ssl/private/nginx-selfsigned.key 2048

# Generate certificate
openssl req -new -x509 -key /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -days 365 -subj "/C=US/ST=CA/L=San Francisco/O=KCS/CN=api.letscatchup-kcs.com"

# Set appropriate permissions
chmod 600 /etc/ssl/private/nginx-selfsigned.key
chmod 644 /etc/ssl/certs/nginx-selfsigned.crt

echo "SSL certificates generated successfully!"
echo "Certificate: /etc/ssl/certs/nginx-selfsigned.crt"
echo "Private Key: /etc/ssl/private/nginx-selfsigned.key"
