FROM node:24-alpine as base
WORKDIR /app
RUN npm install -g npm@11.17.0
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --frozen-lockfile || npm install

FROM node:24-alpine as builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 && chown -R nextjs:nodejs /app

USER nextjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000
CMD ["npm", "start"]
