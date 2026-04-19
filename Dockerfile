# ──────────────────────────────────────────────
# Stage 1 — build the React client
# ──────────────────────────────────────────────
FROM node:22-alpine AS client-builder

WORKDIR /build/client

COPY client/package*.json ./
RUN npm ci --ignore-scripts

COPY client/ ./
RUN npm run build


# ──────────────────────────────────────────────
# Stage 2 — build the Express server
# ──────────────────────────────────────────────
FROM node:22-alpine AS server-builder

WORKDIR /build/server

COPY server/package*.json ./
RUN npm ci --ignore-scripts

COPY server/ ./
RUN npm run build


# ──────────────────────────────────────────────
# Stage 3 — production image
# ──────────────────────────────────────────────
FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Runtime server dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Compiled server JS
COPY --from=server-builder /build/server/dist ./dist

# Built client — served as static files by Express in production mode
COPY --from=client-builder /build/client/dist ./public

# Non-root user
RUN addgroup -S popkorn && adduser -S popkorn -G popkorn
USER popkorn

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
