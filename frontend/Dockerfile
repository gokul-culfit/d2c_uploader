FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs ./
COPY client ./client
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 4173

CMD ["node", "server/index.js"]

