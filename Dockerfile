# Multi-stage Dockerfile for AI Daily Task Tracker (Unified Full-stack)

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies for both workspaces
RUN npm ci

# Copy source files
COPY server/ ./server/
COPY client/ ./client/

# Build backend and frontend
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Copy root and workspace package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma schema and generate client in production
COPY server/prisma ./server/prisma
RUN cd server && npx prisma generate

# Copy built artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
