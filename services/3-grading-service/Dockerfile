# Dockerfile untuk Grading Service

# ---- Stage 1: Build ----
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
# RUN npm run build

# ---- Stage 2: Production ----
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Ekspos port spesifik untuk grading-service
EXPOSE 4003

CMD ["npm", "run", "dev"]