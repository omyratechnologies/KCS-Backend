FROM oven/bun:1.2.15 AS builder

# Install system dependencies required for MediaSoup
USER root
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.15

USER root
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r bunuser && useradd -r -g bunuser bunuser

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production && \
    bun install --force mediasoup && \
    chown -R bunuser:bunuser /app/node_modules

# Copy built application and source files from builder stage
COPY --from=builder --chown=bunuser:bunuser /app/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/src ./src
COPY --from=builder --chown=bunuser:bunuser /app/tsconfig.json ./tsconfig.json

USER bunuser

# Expose ports for HTTP API and Socket.IO
EXPOSE 4500 4501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

CMD ["bun", "start"]
