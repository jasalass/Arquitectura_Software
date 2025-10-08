FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Generar Prisma Client
FROM node:20-alpine AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
RUN npx prisma generate

# Imagen final
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY . .
COPY prisma ./prisma
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/index.js"]
