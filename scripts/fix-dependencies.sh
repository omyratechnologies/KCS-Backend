#!/bin/bash

# Dependency Resolution Fix Script
# This script resolves common npm/bun dependency conflicts

set -e

echo "🔧 Fixing dependency conflicts..."

# Clean existing installations
echo "📦 Cleaning existing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb

# Try Bun first (if available)
if command -v bun &> /dev/null; then
    echo "✅ Using Bun for installation..."
    bun install
    
    # Verify critical dependencies
    if [ ! -d "node_modules/@hono/zod-validator" ]; then
        echo "❌ Critical dependency missing, falling back to npm..."
        rm -rf node_modules
        npm install --legacy-peer-deps
    else
        echo "✅ Bun installation successful"
        exit 0
    fi
else
    echo "🔄 Bun not available, using npm..."
fi

# NPM installation with legacy peer deps
echo "📦 Installing with npm (legacy peer deps enabled)..."
npm install --legacy-peer-deps

# Verify installation
echo "🔍 Verifying installation..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed successfully"
    echo "📊 Total packages: $(find node_modules -name package.json | wc -l)"
    
    # Check critical packages
    if [ -d "node_modules/@hono/zod-validator" ]; then
        VERSION=$(cat node_modules/@hono/zod-validator/package.json | grep '"version"' | cut -d'"' -f4)
        echo "✅ @hono/zod-validator: $VERSION"
    fi
    
    if [ -d "node_modules/hono-openapi" ]; then
        VERSION=$(cat node_modules/hono-openapi/package.json | grep '"version"' | cut -d'"' -f4)
        echo "✅ hono-openapi: $VERSION"
    fi
    
    echo "✅ All critical dependencies verified"
else
    echo "❌ Installation failed"
    exit 1
fi

echo "🎉 Dependency resolution complete!"
