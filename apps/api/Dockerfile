FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/api --workspace packages/shared
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN npm run build --workspace apps/api

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/apps/api/package.json apps/api/
RUN npm ci --workspace apps/api --workspace packages/shared --omit=dev
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/apps/api/migrations/ apps/api/migrations/
EXPOSE 8787
CMD ["node", "apps/api/dist/server.js"]
