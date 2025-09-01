# Stage 1: Build the application
FROM node:18-alpine AS builder

# Atur direktori kerja
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Instal dependensi 'shared' terlebih dahulu
# Ini memanfaatkan caching Docker jika 'shared' tidak berubah
COPY shared ../shared
RUN npm install ../shared

# Instal dependensi aplikasi
RUN npm install

# Salin semua file sumber
COPY . .

# Hasilkan Prisma Client
RUN npx prisma generate

# Kompilasi TypeScript ke JavaScript
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Instal HANYA dependensi produksi
RUN npm install --omit=dev

# Salin hasil build dari stage 'builder'
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public


# Expose port yang digunakan oleh aplikasi
# PORT akan ditentukan oleh environment variable di docker-compose
EXPOSE ${PORT}

# Perintah untuk menjalankan aplikasi
CMD [ "node", "dist/index.js" ]