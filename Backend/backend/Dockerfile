# ---- Build stage ----
# Compile TypeScript to JavaScript in a temporary build container
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests first (Docker caches this layer)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source code + tsconfig
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → dist/
RUN npm run build

# ---- Production stage ----
# Smaller image with only what's needed to run
FROM node:20-slim

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies (no typescript, no ts-node-dev)
RUN npm ci --omit=dev

# Copy compiled JS from the build stage
COPY --from=builder /app/dist ./dist

# Copy migrations (needed at runtime for DB setup)
COPY migrations/ ./migrations/

EXPOSE 3000

CMD ["node", "dist/server.js"]
