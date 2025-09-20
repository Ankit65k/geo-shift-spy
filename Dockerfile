# Multi-stage build for production deployment
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

# Install system dependencies for Sharp and Canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with node-gyp rebuild
RUN npm ci --only=production && npm rebuild canvas

# Copy backend source
COPY backend/ ./backend/
COPY uploads/ ./uploads/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Start the application
CMD ["node", "backend/server.js"]