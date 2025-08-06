# 🚀 KCS Backend Development Environment Setup

This guide will help you set up the KCS Backend development environment with Docker, hot reload, and
proper CI/CD integration.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.0 or later)
- **Docker Compose** (v2.0 or later)
- **Bun** (v1.2 or later) - Will be installed automatically if missing
- **Git**
- **Node.js** (v20 or later) - Optional, for IDE support

## 🎯 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd KCS-Backend

# Run the setup script
./scripts/dev-setup.sh
```

### 2. Configure Environment

```bash
# Copy and edit environment variables
cp .env.development.example .env.development

# Edit the file with your configuration
nano .env.development
```

### 3. Start Development Environment

```bash
# Start all services with hot reload
bun run dev:docker

# Or use Docker Compose directly
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Verify Setup

```bash
# Check API health
curl http://localhost:4500/api/health

# Check Socket.IO
curl http://localhost:4501/socket.io/

# View logs
bun run dev:docker:logs
```

## 🔧 Development Workflow

### Hot Reload Development

The development environment supports hot reload for rapid development:

```bash
# Start with hot reload (recommended)
bun run dev:docker

# Make changes to src/ files
# Changes will automatically reload the application
```

### Local Development (Without Docker)

For faster iteration, you can run the API locally:

```bash
# Install dependencies
bun install

# Start local development server
bun run dev

# API will be available at http://localhost:4500
```

### Code Quality

```bash
# Fix linting issues
bun run lint:fix

# Check code formatting
bun run format:check

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage
```

## 🐳 Docker Commands

### Container Management

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View container status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker-compose -f docker-compose.dev.yml restart api-dev

# Stop environment
docker-compose -f docker-compose.dev.yml down

# Clean everything (including volumes)
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
```

### Debugging

```bash
# Access running container
docker exec -it kcs-api-dev /bin/bash

# View application logs
docker logs kcs-api-dev -f

# Debug with Node.js inspector (port 9229)
# Attach your IDE to localhost:9229
```

## 🌐 Available Services

| Service      | URL                              | Description         |
| ------------ | -------------------------------- | ------------------- |
| API          | http://localhost:4500            | Main API server     |
| Health Check | http://localhost:4500/api/health | Health endpoint     |
| Socket.IO    | http://localhost:4501            | WebSocket server    |
| Redis        | localhost:6379                   | Redis cache         |
| Nginx        | http://localhost:80              | Reverse proxy       |
| Couchbase    | http://localhost:8091            | Database (optional) |

## 📁 Project Structure

```
KCS-Backend/
├── src/                      # Source code
│   ├── controllers/         # API controllers
│   ├── services/           # Business logic
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── middlewares/        # Express middlewares
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup/              # Test setup
├── docker-compose.dev.yml   # Development Docker Compose
├── Dockerfile.dev          # Development Dockerfile
├── .env.development        # Development environment variables
├── scripts/                # Development scripts
└── docs/                   # Documentation
```

## 🔨 Available Scripts

```bash
# Development
bun run dev                 # Start local development server
bun run dev:docker         # Start Docker development environment
bun run dev:docker:down    # Stop Docker environment
bun run dev:docker:logs    # View Docker logs
bun run dev:clean          # Clean Docker environment

# Building
bun run build              # Build application
bun run prebuild           # Clean dist folder
bun run postbuild          # Generate TypeScript declarations

# Testing
bun run test               # Run tests
bun run test:watch         # Run tests in watch mode
bun run test:coverage      # Run tests with coverage

# Code Quality
bun run lint               # Run ESLint
bun run lint:fix           # Fix ESLint issues
bun run lint:check         # Check lint without fixing
bun run format             # Format code with Prettier
bun run format:check       # Check formatting

# Production
bun run start              # Start production server
```

## 🔐 Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=development
PORT=4500
SOCKET_IO_PORT=4501

# Database
DB_HOST=localhost
DB_PORT=8091
DB_NAME=kcs_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
```

### Optional Variables

```bash
# AWS (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your_bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Payment Gateways (sandbox)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret
```

## 🚀 CI/CD Integration

The development environment is integrated with CI/CD pipelines:

### Jenkins Pipeline

- **Development Branch**: Deploys to development environment
- **Main Branch**: Deploys to production environment
- **Quality Gates**: Linting, testing, security scanning

### GitHub Actions

- **Pull Requests**: Runs tests and quality checks
- **Push to dev**: Deploys to development
- **Push to main**: Deploys to production

### Pipeline Features

- ✅ Automated testing
- ✅ Code quality checks
- ✅ Security scanning
- ✅ Docker image building
- ✅ Environment-specific deployments
- ✅ Health checks
- ✅ Microsoft Teams notifications

## 🔍 Debugging

### Common Issues

1. **Port conflicts**:

    ```bash
    # Check what's using the port
    lsof -i :4500

    # Kill the process
    kill -9 <PID>
    ```

2. **Docker build issues**:

    ```bash
    # Clean Docker cache
    docker system prune -a

    # Rebuild without cache
    docker-compose -f docker-compose.dev.yml build --no-cache
    ```

3. **Permission issues**:
    ```bash
    # Fix file permissions
    sudo chown -R $USER:$USER .
    ```

### Debug Mode

Enable debug mode in your `.env.development`:

```bash
DEBUG_MODE=true
LOG_LEVEL=debug
```

### IDE Setup

For VS Code, create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to Docker",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/src",
            "remoteRoot": "/app/src",
            "protocol": "inspector"
        }
    ]
}
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:4500/api/health

# Database health
curl http://localhost:4500/api/health/database

# Redis health
redis-cli ping

# WebSocket health
curl http://localhost:4501/socket.io/
```

### Logs

```bash
# Application logs
docker logs kcs-api-dev -f

# All services logs
docker-compose -f docker-compose.dev.yml logs -f

# Specific service logs
docker-compose -f docker-compose.dev.yml logs -f redis-dev
```

## 🤝 Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Run tests and linting: `bun run test && bun run lint:fix`
4. Create a pull request to `dev` branch
5. CI/CD will automatically run checks
6. After review, merge to `dev` for development deployment

## 📞 Support

If you encounter any issues:

1. Check the [troubleshooting section](#debugging)
2. Review container logs
3. Ensure all environment variables are set
4. Check if all required ports are available
5. Verify Docker and Bun installations

For additional support, contact the development team.
