FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /opt/app

RUN addgroup -S strapi && adduser -S strapi -G strapi
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=strapi:strapi dist/ ./
COPY --chown=strapi:strapi public/ ./public/
COPY --chown=strapi:strapi scripts/ ./scripts/
COPY --chown=strapi:strapi favicon.png ./favicon.png
RUN test -f /opt/app/build/index.html
RUN mkdir -p /opt/app/database/migrations && chown -R strapi:strapi /opt/app/database

USER strapi
EXPOSE 1337
CMD ["npm", "run", "start"]
