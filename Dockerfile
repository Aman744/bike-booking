# ==========================================
# Stage 1: Base Build Env
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configs and package definitions
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build workspaces
RUN npm run build:shared
RUN npm run build:server
RUN npm run build:client

# ==========================================
# Stage 2: Server Production Image
# ==========================================
FROM node:20-alpine AS server-prod
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "run", "start:server"]

# ==========================================
# Stage 3: Client Production Image (Nginx)
# ==========================================
FROM nginx:alpine AS client-prod
COPY --from=builder /app/client/dist /usr/share/nginx/html
# Custom basic routing config for single-page apps
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $$uri $$uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
