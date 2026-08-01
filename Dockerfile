# ==========================================
# Single-stage production build for Render
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Copy all package manifests and lockfile
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies (includes workspaces)
RUN npm ci

# Copy full source code
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared types first, then server
RUN npm run build:shared
RUN npm run build:server

ENV NODE_ENV=production

# Render injects PORT automatically — expose it
EXPOSE 10000

CMD ["node", "server/dist/server.js"]
