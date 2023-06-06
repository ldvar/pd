FROM node:18.15.0-alpine as build

WORKDIR ./

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY tsconfig.build.json tsconfig.build.json
COPY libs ./libs
COPY apps ./apps

RUN npm install -g rimraf
RUN npm install -g @nestjs/cli
RUN yarn install

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY tsconfig.build.json tsconfig.build.json
COPY libs ./libs
COPY apps ./apps

RUN yarn build pools


CMD ["yarn", "start pools"]
