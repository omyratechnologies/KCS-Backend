#!/bin/bash

# Quick Jenkins Pipeline Test Script
# Tests individual components of the pipeline

set -e

echo "🧪 Testing Jenkins Pipeline Components"
echo "====================================="

# Test 1: Check if Dockerfile.simple builds
echo "📦 Test 1: Docker Build Test"
echo "----------------------------"
if [ -f "Dockerfile.simple" ]; then
    echo "✅ Dockerfile.simple exists"
    
    # Quick syntax check
    if docker build -f Dockerfile.simple --no-cache -t kcs-test . --dry-run 2>/dev/null || \
       docker build -f Dockerfile.simple -t kcs-test . --build-arg BUILD_NUMBER=test --build-arg BUILD_TIMESTAMP=test --build-arg GIT_COMMIT=test --build-arg NODE_ENV=development 2>/dev/null; then
        echo "✅ Docker build syntax OK"
        docker rmi kcs-test 2>/dev/null || echo "Cleanup completed"
    else
        echo "❌ Docker build test failed"
    fi
else
    echo "❌ Dockerfile.simple not found"
fi

echo

# Test 2: Check package.json scripts
echo "📝 Test 2: Package Scripts Check"
echo "--------------------------------"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    
    # Check required scripts
    scripts=("build" "test" "test:ci" "start")
    for script in "${scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            echo "✅ Script '$script' found"
        else
            echo "⚠️ Script '$script' missing"
        fi
    done
else
    echo "❌ package.json not found"
fi

echo

# Test 3: Check environment variables
echo "🔧 Test 3: Environment Variables"
echo "--------------------------------"
echo "BRANCH_NAME: ${BRANCH_NAME:-'dev'}"
echo "NODE_ENV: ${NODE_ENV:-'development'}"
echo "BUILD_NUMBER: ${BUILD_NUMBER:-'test'}"

# Test branch tag resolution
BRANCH_TAG="${BRANCH_NAME:-'dev'}"
echo "✅ BRANCH_TAG resolves to: $BRANCH_TAG"

echo

# Test 4: Check Docker system
echo "🐳 Test 4: Docker System Check"
echo "------------------------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker available: $(docker --version)"
    
    if docker info &> /dev/null; then
        echo "✅ Docker daemon running"
        echo "Docker space: $(docker system df --format 'table {{.Type}}\t{{.Size}}')"
    else
        echo "❌ Docker daemon not running"
    fi
else
    echo "❌ Docker not installed"
fi

echo

# Test 5: Check dependencies
echo "📦 Test 5: Dependencies Check"
echo "-----------------------------"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    echo "Packages installed: $(ls node_modules | wc -l)"
else
    echo "⚠️ node_modules not found - run npm install"
fi

echo

# Test 6: Check scripts
echo "📄 Test 6: Scripts Check"
echo "------------------------"
scripts_dir="scripts"
if [ -d "$scripts_dir" ]; then
    echo "✅ Scripts directory exists"
    for script in setup-dev-server.sh verify-deployment.sh system-health-check.sh; do
        if [ -f "$scripts_dir/$script" ]; then
            if [ -x "$scripts_dir/$script" ]; then
                echo "✅ $script (executable)"
            else
                echo "⚠️ $script (not executable)"
            fi
        else
            echo "❌ $script missing"
        fi
    done
else
    echo "❌ Scripts directory not found"
fi

echo

# Summary
echo "📋 Test Summary"
echo "==============="
echo "✅ Basic pipeline components validated"
echo "🔧 Check individual test results above for any issues"
echo
echo "💡 To run a local test build:"
echo "   docker build -f Dockerfile.simple -t kcs-backend:test ."
echo
echo "🚀 To test deployment scripts:"
echo "   ./scripts/system-health-check.sh"
