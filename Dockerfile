FROM node:22-alpine AS builder
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /opt/app
RUN addgroup -S strapi && adduser -S strapi -G strapi
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=strapi:strapi /opt/app/dist/ ./
COPY --chown=strapi:strapi public/ ./public/
COPY --chown=strapi:strapi scripts/ ./scripts/
COPY --chown=strapi:strapi favicon.png ./favicon.png
RUN test -f /opt/app/build/index.html && mkdir -p /opt/app/database/migrations && chown -R strapi:strapi /opt/app/database /opt/app/public/uploads
USER strapi
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||1337)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
