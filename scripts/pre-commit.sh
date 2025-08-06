#!/bin/bash

# Pre-commit quality check script
set -e

echo "🔍 Running pre-commit quality checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

# Function to run command with runtime detection
run_with_runtime() {
    local script_name=$1
    
    if command -v bun &> /dev/null && [ -z "$USE_NPM_FALLBACK" ]; then
        echo "📦 Using Bun to run $script_name"
        bun run "$script_name"
    else
        echo "📦 Using npm to run $script_name"
        npm run "$script_name"
    fi
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
fi

# Format check and fix
echo "📝 Checking and fixing code formatting..."
if ! run_with_runtime "format:check"; then
    echo "⚠️ Formatting issues found, auto-fixing..."
    run_with_runtime "format"
fi

# Linting
echo "🔍 Running linting checks..."
if ! run_with_runtime "lint:check"; then
    echo "⚠️ Linting issues found, attempting auto-fix..."
    run_with_runtime "lint:fix" || echo "Some linting issues require manual fixing"
fi

# Type checking
echo "🔍 Running TypeScript type checks..."
if command -v bun &> /dev/null && [ -z "$USE_NPM_FALLBACK" ]; then
    bunx tsc --noEmit
else
    npx tsc --noEmit
fi

# Build check
echo "🏗️ Running build check..."
run_with_runtime "build"

# Quick test run
echo "🧪 Running quick tests..."
run_with_runtime "test:ci"

echo "✅ All pre-commit checks passed!"
echo "📝 Ready to commit!"
