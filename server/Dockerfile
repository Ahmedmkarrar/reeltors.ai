# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# prune devDependencies from node_modules after build
RUN npm prune --omit=dev


# ── Stage 2: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# temp dir for local frame processing
RUN mkdir -p temp && chown appuser:appgroup temp

COPY --chown=appuser:appgroup start.sh ./
RUN chmod +x start.sh

USER appuser

EXPOSE 4000

CMD ["./start.sh"]
