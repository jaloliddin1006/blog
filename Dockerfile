# One image: the built site and the studio behind it.
#
#   docker build -t mamatmusayev .
#   docker run -p 8080:8080 -v ./data:/app/data -v ./public/projects:/app/public/projects mamatmusayev
#
# The site is served from dist/. When the studio changes a post or a project the
# container rebuilds dist/ itself, which is why the toolchain stays in the image.

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

# Everything the build produced, plus the toolchain the rebuild needs.
COPY --from=build /app /app
RUN npm prune --omit=dev && npm cache clean --force

# Content and uploads belong to the host, not to the image.
VOLUME ["/app/data", "/app/public/projects"]

# Runs unprivileged: files written into the mounted volumes stay owned by uid
# 1000, not root. Give the host directories to the same uid before mounting.
RUN chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/app.mjs"]
