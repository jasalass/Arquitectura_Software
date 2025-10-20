# =========
# STAGE 1: BUILD
# =========
FROM node:20-alpine AS builder

# Evita prompts y reduce tamaño
ENV CI=true

# Crea directorio de trabajo
WORKDIR /app

# Copiamos solo lo necesario primero para cachear deps
COPY package*.json ./

# Si tienes package-lock.json usa 'npm ci'; si NO, cambia a 'npm install'
RUN npm ci

# Copiamos el resto del código
COPY . .

# Compilamos para producción (angular.json ya tiene defaultConfiguration=production)
RUN npm run build

# =========
# STAGE 2: RUNTIME (Nginx)
# =========
FROM nginx:1.27-alpine

# Remueve config por defecto y agrega la nuestra
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia artefactos del build (Ionic + Angular) -> 'www'
# Tu angular.json define outputPath base "www"
COPY --from=builder /app/www /usr/share/nginx/html

# (Opcional) Seguridad básica de Nginx
RUN adduser -D -H -u 1001 appuser \
  && chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx


EXPOSE 80

# Healthcheck simple (puedes ajustarlo en Docker/Compose/K8s)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
