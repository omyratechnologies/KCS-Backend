FROM oven/bun:1.2.15 AS builder

# Install system dependencies required for MediaSoup
USER root

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install bun dependencies
RUN bun install

# Update package lists and install build dependencies including curl
RUN apt-get update && \
    apt-get install -y curl build-essential cmake make gcc g++ python3 python3-dev git libuv1-dev libssl-dev pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js for mediasoup worker build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Build MediaSoup worker binary
RUN cd node_modules/mediasoup && npm run worker:build

# Verify the worker was built successfully
RUN ls -la node_modules/mediasoup/worker/out/Release/mediasoup-worker

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.15-alpine

USER root
RUN apk add --no-cache \
    curl \
    build-base \
    python3 \
    python3-dev \
    git \
    cmake \
    make \
    gcc \
    g++ \
    libuv-dev \
    openssl-dev \
    nodejs \
    npm && \
    addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production && \
    chown -R bunuser:bunuser /app/node_modules

# Copy built application and source files from builder stage
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/src ./src
COPY --from=builder --chown=bunuser:bunuser /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=bunuser:bunuser /app/node_modules/mediasoup/worker ./node_modules/mediasoup/worker

USER bunuser

# Expose ports for HTTP API and Socket.IO
EXPOSE 4500 4501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

CMD ["bun", "start"]