FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# AUTH_BASE_URL se inyecta en runtime (K8s/Compose)
EXPOSE 3000
CMD ["node", "index.js"]
