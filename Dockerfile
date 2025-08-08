# ==============================================================================
# 🚀 KCS Backend - Optimized Multi-Stage Dockerfile
# Features: Smart caching, conditional MediaSoup, fastest builds
# ==============================================================================

FROM oven/bun:1.2.15-slim AS base

# Install only essential system tools
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# ==============================================================================
# 📦 Dependencies Stage - Smart Package Management
# ==============================================================================

FROM base AS deps

# Copy package files for dependency resolution
COPY package.json bun.lock* ./

# Smart MediaSoup detection and conditional toolchain installation
RUN set -e; \
    echo "🔍 Analyzing project dependencies..."; \
    NEEDS_MEDIASOUP=false; \
    NEEDS_BUILD_TOOLS=false; \
    \
    # Check if MediaSoup is required
    if grep -q '"mediasoup"' package.json; then \
        echo "� MediaSoup detected - video conferencing enabled"; \
        NEEDS_MEDIASOUP=true; \
        NEEDS_BUILD_TOOLS=true; \
    fi; \
    \
    # Check for other native dependencies
    if grep -qE '"(canvas|sharp|sqlite3|bcrypt)"' package.json; then \
        echo "🔧 Native dependencies detected"; \
        NEEDS_BUILD_TOOLS=true; \
    fi; \
    \
    # Install build tools only if needed
    if [ "$NEEDS_BUILD_TOOLS" = "true" ]; then \
        echo "⚙️  Installing build tools (cached if available)..."; \
        apt-get update && apt-get install -y --no-install-recommends \
            build-essential \
            python3 \
            python3-dev \
            git \
            cmake \
            make \
            gcc \
            g++ \
            libuv1-dev \
            libssl-dev \
            nodejs \
            npm \
            && rm -rf /var/lib/apt/lists/* \
            && apt-get clean; \
        echo "✅ Build environment ready"; \
    else \
        echo "🪶 No native dependencies - using minimal build"; \
    fi; \
    \
    # Save flags for next stages
    echo "$NEEDS_MEDIASOUP" > /tmp/needs_mediasoup; \
    echo "$NEEDS_BUILD_TOOLS" > /tmp/needs_build_tools

# Install dependencies with Bun (fastest package manager)
RUN echo "📦 Installing dependencies..." && \
    bun install --frozen-lockfile --production=false && \
    echo "✅ Dependencies installed successfully"

# ==============================================================================
# 🏗️  Builder Stage - Conditional Compilation
# ==============================================================================

FROM deps AS builder

# Copy source code
COPY . .

# Build MediaSoup worker only if required
RUN set -e; \
    NEEDS_MEDIASOUP=$(cat /tmp/needs_mediasoup 2>/dev/null || echo "false"); \
    if [ "$NEEDS_MEDIASOUP" = "true" ] && [ -d "node_modules/mediasoup" ]; then \
        echo "🏗️  Building MediaSoup worker (this may take a few minutes)..."; \
        cd node_modules/mediasoup; \
        # Check if worker already exists
        if [ ! -f "worker/Release/mediasoup-worker" ]; then \
            npm run worker:build && echo "✅ MediaSoup worker built successfully"; \
        else \
            echo "ℹ️  MediaSoup worker already exists, skipping build"; \
        fi; \
        cd ../..; \
    else \
        echo "ℹ️  Skipping MediaSoup worker build"; \
    fi

# Build the application
RUN echo "🏗️  Building application..." && \
    bun run build && \
    echo "✅ Application built successfully" && \
    ls -la dist/

# ==============================================================================
# 🚀 Production Stage - Minimal Runtime
# ==============================================================================

FROM oven/bun:1.2.15-slim AS production

USER root

# Create user first
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy package files for runtime dependency check
COPY --from=deps /app/package.json /app/bun.lock* ./

# Install runtime dependencies for MediaSoup only if needed
RUN set -e; \
    if grep -q '"mediasoup"' package.json; then \
        echo "� Installing MediaSoup runtime dependencies..."; \
        apt-get update && apt-get install -y --no-install-recommends \
            libuv1 \
            libssl3 \
            && rm -rf /var/lib/apt/lists/* \
            && apt-get clean; \
        echo "✅ Runtime dependencies installed"; \
    else \
        echo "🪶 Minimal runtime - no additional dependencies needed"; \
    fi

# Install production dependencies only
RUN bun install --production --frozen-lockfile && \
    # Clean up unnecessary files
    find node_modules -name "*.md" -delete && \
    find node_modules -name "*.txt" -delete && \
    find node_modules -name "*.ts" -not -path "*/types/*" -delete && \
    find node_modules -name "test*" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true

# Copy built application
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/src ./src
COPY --from=builder --chown=bunuser:bunuser /app/tsconfig.json ./

# Copy MediaSoup worker if it exists
RUN set -e; \
    mkdir -p ./node_modules/mediasoup/worker; \
    echo "📦 Preparing MediaSoup worker directory..."

# Conditional copy of MediaSoup worker
COPY --from=builder /app/node_modules/mediasoup ./node_modules/mediasoup

# Set ownership
RUN chown -R bunuser:bunuser /app

# Switch to non-root user
USER bunuser

# Expose ports
EXPOSE 4500 4501

# Add labels for better container management
LABEL maintainer="KCS Team"
LABEL description="KCS Backend - Educational Management System"
LABEL version="1.0.0"

# Health check with faster timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4500/api/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the application
CMD ["bun", "start"]

# ==============================================================================
# 🎯 Build Optimization Summary:
# - Multi-stage build for minimal final image
# - Smart MediaSoup detection and conditional building
# - Aggressive caching with .dockerignore
# - Production dependency cleanup
# - Non-root user for security
# - Proper signal handling with tini
# - Health checks optimized for fast startup
# ==============================================================================