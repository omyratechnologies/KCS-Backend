FROM oven/bun:1.2.15 AS builder

# Install system dependencies required for MediaSoup
USER root

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install bun dependencies
RUN bun install

# Update package lists and install build dependencies including curl and pip
RUN apt-get update && \
    apt-get install -y curl build-essential cmake make gcc g++ python3 python3-dev python3-pip git libuv1-dev libssl-dev pkg-config && \
    pip3 install --upgrade pip setuptools wheel --break-system-packages && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js for mediasoup worker build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Build MediaSoup worker binary with verbose output
RUN cd node_modules/mediasoup && \
    echo "Building MediaSoup worker..." && \
    npm run worker:build --verbose && \
    echo "MediaSoup worker build completed"

# Verify the worker was built successfully and list the contents
RUN ls -la node_modules/mediasoup/worker/out/Release/ && \
    file node_modules/mediasoup/worker/out/Release/mediasoup-worker && \
    chmod +x node_modules/mediasoup/worker/out/Release/mediasoup-worker

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.15-alpine

USER root
RUN apk add --no-cache \
    curl \
    nodejs \
    npm && \
    addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Copy built application and dependencies from builder stage FIRST
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/src ./src
COPY --from=builder --chown=bunuser:bunuser /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=bunuser:bunuser /app/node_modules ./node_modules

# Change ownership of the copied files
RUN chown -R bunuser:bunuser /app

USER bunuser

# Expose ports for HTTP API and Socket.IO
EXPOSE 4500 4501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

CMD ["bun", "start"]