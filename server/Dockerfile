# Backend image: build TypeScript, then run migrations + seed + server.
# node:20-slim (Debian) ships libssl3 — Prisma's engine needs it; alpine/musl
# triggers OpenSSL detection failures.
FROM node:20-slim

WORKDIR /app

# Prisma engine runtime dependency.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000

# Sync schema to DB, seed the default board, then start.
# db push is used (no migration history) for simplicity in this take-home.
CMD sh -c "npx prisma db push --accept-data-loss && npm run seed && node dist/index.js"
