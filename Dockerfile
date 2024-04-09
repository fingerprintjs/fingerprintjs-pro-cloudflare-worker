FROM node:16 as base

WORKDIR /app

COPY package.json ./
COPY .lock ./
EXPOSE 3000

FROM base as test
RUN npm install -g pnpm
RUN pnpm install
COPY . .
CMD ["pnpm", "lint"]
CMD ["pnpm", "test"]

FROM base as build
RUN pnpm install
COPY . .
RUN pnpm build
