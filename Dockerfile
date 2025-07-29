FROM oven/bun:1.2.15

# Install system dependencies required for MediaSoup
USER root
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Rebuild MediaSoup native binaries for the container environment
RUN npm rebuild mediasoup

# Create a non-root user for security
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser
RUN chown -R bunuser:bunuser /app
USER bunuser

# Expose ports for HTTP API and Socket.IO
EXPOSE 4500 4501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

CMD ["bun", "start"]
