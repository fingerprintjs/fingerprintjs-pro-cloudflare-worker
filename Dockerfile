# We are using node's image as base for this one
FROM node:16 as base

# Create the app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
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
