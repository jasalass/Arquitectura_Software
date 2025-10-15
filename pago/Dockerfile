# pago/Dockerfile

# 1) Instala dependencias en una capa separada
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Imagen final
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copia node_modules ya resueltas
COPY --from=deps /app/node_modules ./node_modules

# Copia el código fuente
COPY . .

# Expone el puerto del servicio de pago
EXPOSE 7000

# Arranque del servicio
CMD ["node", "src/index.js"]
