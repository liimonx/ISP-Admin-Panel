#!/bin/bash

# ISP Admin Frontend Build Script
# This script builds the frontend Docker image with proper tagging and optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="isp-admin-frontend"
TAG="latest"
BUILD_CONTEXT="./frontend"

echo -e "${BLUE}🚀 ISP Admin Frontend Build Script${NC}"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$BUILD_CONTEXT" ]; then
    echo -e "${RED}❌ Frontend directory not found: $BUILD_CONTEXT${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$BUILD_CONTEXT/package.json" ]; then
    echo -e "${RED}❌ package.json not found in frontend directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image...${NC}"
echo "Image: $IMAGE_NAME:$TAG"
echo "Context: $BUILD_CONTEXT"
echo ""

# Build the Docker image
docker build \
    --tag "$IMAGE_NAME:$TAG" \
    --tag "$IMAGE_NAME:$(date +%Y%m%d-%H%M%S)" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    --progress=plain \
    "$BUILD_CONTEXT"

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Image Information:${NC}"
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo -e "${YELLOW}🔍 To run the container:${NC}"
    echo "docker run -p 3000:80 $IMAGE_NAME:$TAG"
    echo ""
    echo -e "${YELLOW}🔍 To test the build:${NC}"
    echo "docker run --rm -p 3000:80 $IMAGE_NAME:$TAG"
    echo ""
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi
