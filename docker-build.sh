#!/bin/bash

# ==============================================================================
# 🚀 KCS Backend - Ultra-Fast Docker Build Script
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="kcs-backend"
TAG="latest"
BUILD_TYPE="auto"
PUSH_TO_REGISTRY=false
PLATFORM="linux/amd64"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        --push)
            PUSH_TO_REGISTRY=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --help)
            echo "🚀 KCS Backend Docker Build Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --name     Image name (default: kcs-backend)"
            echo "  --tag      Image tag (default: latest)"
            echo "  --type     Build type: auto|full|light (default: auto)"
            echo "  --push     Push to registry after build"
            echo "  --platform Target platform (default: linux/amd64)"
            echo "  --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Auto-detect and build"
            echo "  $0 --type light            # Force lightweight build"
            echo "  $0 --type full --push      # Full build and push"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 KCS Backend Docker Build Script${NC}"
echo -e "${BLUE}===================================${NC}"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Check if Docker BuildKit is enabled
export DOCKER_BUILDKIT=1

# Detect build type if auto
if [ "$BUILD_TYPE" = "auto" ]; then
    echo -e "${YELLOW}🔍 Auto-detecting build requirements...${NC}"
    
    if grep -q '"mediasoup"' package.json; then
        BUILD_TYPE="full"
        echo -e "${GREEN}📹 MediaSoup detected - using full build${NC}"
    else
        BUILD_TYPE="light"
        echo -e "${GREEN}🪶 No MediaSoup - using lightweight build${NC}"
    fi
fi

# Set Dockerfile based on build type
case $BUILD_TYPE in
    "full")
        DOCKERFILE="Dockerfile"
        echo -e "${BLUE}📦 Building full image with MediaSoup support${NC}"
        ;;
    "light")
        DOCKERFILE="Dockerfile.light"
        echo -e "${BLUE}🪶 Building lightweight image${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid build type: $BUILD_TYPE${NC}"
        echo -e "${YELLOW}Valid types: auto, full, light${NC}"
        exit 1
        ;;
esac

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Dockerfile not found: $DOCKERFILE${NC}"
    exit 1
fi

# Build arguments
BUILD_ARGS=""
BUILD_ARGS="$BUILD_ARGS --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
BUILD_ARGS="$BUILD_ARGS --build-arg VERSION=$(git describe --tags --always 2>/dev/null || echo 'dev')"
BUILD_ARGS="$BUILD_ARGS --build-arg COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# Build command
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo -e "${YELLOW}⚙️  Build Configuration:${NC}"
echo "   📝 Dockerfile: $DOCKERFILE"
echo "   🏷️  Image: $FULL_IMAGE_NAME"
echo "   🎯 Platform: $PLATFORM"
echo "   📅 Build Date: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"

echo -e "${BLUE}🏗️  Starting Docker build...${NC}"

# Start timing
start_time=$(date +%s)

# Build the image
if docker build \
    -f "$DOCKERFILE" \
    --platform "$PLATFORM" \
    $BUILD_ARGS \
    -t "$FULL_IMAGE_NAME" \
    --progress=plain \
    .; then
    
    # Calculate build time
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${GREEN}⏱️  Build time: ${build_time}s${NC}"
    
    # Show image size
    image_size=$(docker images --format "table {{.Size}}" "$FULL_IMAGE_NAME" | tail -n 1)
    echo -e "${GREEN}📊 Image size: $image_size${NC}"
    
    # Push to registry if requested
    if [ "$PUSH_TO_REGISTRY" = true ]; then
        echo -e "${BLUE}🚀 Pushing to registry...${NC}"
        if docker push "$FULL_IMAGE_NAME"; then
            echo -e "${GREEN}✅ Push completed successfully!${NC}"
        else
            echo -e "${RED}❌ Push failed${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}🎉 All done! Image ready: $FULL_IMAGE_NAME${NC}"
    
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Optional: Clean up build cache
read -p "🧹 Clean up Docker build cache? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Cleaning up Docker build cache...${NC}"
    docker builder prune -f
    echo -e "${GREEN}✅ Cache cleaned${NC}"
fi

echo -e "${BLUE}🎯 Quick Start Commands:${NC}"
echo "   🐳 Run container:     docker run -p 4500:4500 $FULL_IMAGE_NAME"
echo "   🔍 Inspect image:     docker inspect $FULL_IMAGE_NAME"
echo "   📊 Image history:     docker history $FULL_IMAGE_NAME"
