#!/bin/bash

# ISP Admin Complete Build Script
# This script builds all Docker images for the ISP Admin project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="isp-admin"
BACKEND_IMAGE="$PROJECT_NAME-backend"
FRONTEND_IMAGE="$PROJECT_NAME-frontend"
TAG="latest"

echo -e "${BLUE}🚀 ISP Admin Complete Build Script${NC}"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found in current directory${NC}"
    exit 1
fi

# Function to build backend
build_backend() {
    echo -e "${PURPLE}🔧 Building Backend...${NC}"
    echo "Image: $BACKEND_IMAGE:$TAG"
    echo "Context: ./backend"
    echo ""
    
    if [ ! -d "./backend" ]; then
        echo -e "${RED}❌ Backend directory not found${NC}"
        return 1
    fi
    
    docker build \
        --tag "$BACKEND_IMAGE:$TAG" \
        --tag "$BACKEND_IMAGE:$(date +%Y%m%d-%H%M%S)" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --progress=plain \
        "./backend"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend built successfully!${NC}"
    else
        echo -e "${RED}❌ Backend build failed!${NC}"
        return 1
    fi
    echo ""
}

# Function to build frontend
build_frontend() {
    echo -e "${PURPLE}🎨 Building Frontend...${NC}"
    echo "Image: $FRONTEND_IMAGE:$TAG"
    echo "Context: ./frontend"
    echo ""
    
    if [ ! -d "./frontend" ]; then
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    fi
    
    docker build \
        --tag "$FRONTEND_IMAGE:$TAG" \
        --tag "$FRONTEND_IMAGE:$(date +%Y%m%d-%H%M%S)" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --progress=plain \
        "./frontend"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend built successfully!${NC}"
    else
        echo -e "${RED}❌ Frontend build failed!${NC}"
        return 1
    fi
    echo ""
}

# Function to show build summary
show_summary() {
    echo -e "${BLUE}📋 Build Summary${NC}"
    echo "=================="
    echo ""
    
    echo -e "${YELLOW}🐳 Built Images:${NC}"
    docker images | grep -E "($BACKEND_IMAGE|$FRONTEND_IMAGE)" | head -10
    echo ""
    
    echo -e "${YELLOW}🚀 To start the application:${NC}"
    echo "docker-compose up -d"
    echo ""
    
    echo -e "${YELLOW}🔍 To view logs:${NC}"
    echo "docker-compose logs -f"
    echo ""
    
    echo -e "${YELLOW}🛑 To stop the application:${NC}"
    echo "docker-compose down"
    echo ""
    
    echo -e "${YELLOW}🧹 To clean up:${NC}"
    echo "docker-compose down -v --rmi all"
    echo ""
}

# Main build process
main() {
    echo -e "${YELLOW}Starting build process...${NC}"
    echo ""
    
    # Build backend
    if ! build_backend; then
        echo -e "${RED}❌ Backend build failed. Stopping build process.${NC}"
        exit 1
    fi
    
    # Build frontend
    if ! build_frontend; then
        echo -e "${RED}❌ Frontend build failed. Stopping build process.${NC}"
        exit 1
    fi
    
    # Show summary
    show_summary
    
    echo -e "${GREEN}🎉 All builds completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Copy .env.example to .env and configure your environment variables"
    echo "2. Run: docker-compose up -d"
    echo "3. Access the application at http://localhost"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    "backend")
        build_backend
        ;;
    "frontend")
        build_frontend
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [backend|frontend|help]"
        echo ""
        echo "Options:"
        echo "  backend   Build only the backend image"
        echo "  frontend  Build only the frontend image"
        echo "  help      Show this help message"
        echo ""
        echo "Default: Build all images"
        ;;
    *)
        main
        ;;
esac
