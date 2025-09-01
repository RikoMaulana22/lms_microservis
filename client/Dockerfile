# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Salin package.json dan package-lock.json (atau yarn.lock)
COPY package*.json ./

# Instal dependensi
RUN npm install

# Salin sisa file aplikasi
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Instal dependensi produksi (seperti 'next')
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Salin hasil build dari stage 'builder'
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port 3000
EXPOSE 3000

# Perintah untuk menjalankan server Next.js
CMD ["npm", "start"]