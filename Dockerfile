FROM node:16 as base

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
EXPOSE 3000

FROM base as test
RUN yarn install
COPY . .
CMD ["yarn", "lint"]
CMD ["yarn", "test"]

FROM base as build
RUN yarn install
COPY . .
RUN yarn build
