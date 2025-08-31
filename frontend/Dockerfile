# Build stage
FROM node:18-alpine AS build

# Set environment variables for better build compatibility
ENV GENERATE_SOURCEMAP=false
ENV CI=true

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (skip TypeScript checking for now)
RUN npx vite build

# Production stage
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
