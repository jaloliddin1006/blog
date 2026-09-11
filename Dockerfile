# One image: the built site and the studio behind it.
#
#   docker compose up --build
#
# The site is served from dist/. When the studio changes a post or a project the
# container rebuilds dist/ itself, so the runtime keeps Astro and sharp — but
# only the production dependencies, installed fresh in this stage rather than
# copied from the builder, which keeps the image about half the size.

FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx astro build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Unprivileged from here on, so files written into the mounted volumes stay
# owned by uid 1000 rather than by root. Ownership is set as each layer is
# copied — a recursive chown afterwards would duplicate the whole tree into a
# layer of its own, which cost 359 MB when this was written that way.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Source first, then the build output — .dockerignore keeps dist/ and
# node_modules/ out of the source copy, so neither is clobbered.
COPY --chown=node:node . .
COPY --chown=node:node --from=build /app/dist ./dist

# Content and uploads belong to the host, not to the image.
VOLUME ["/app/data", "/app/public/projects"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/app.mjs"]
