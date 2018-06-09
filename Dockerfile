ARG NODE_VERSION=8.11.1
FROM node:${NODE_VERSION}-alpine

RUN mkdir -p /srv/app

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# default to port 80 for node, and 5858 or 9229 for debug
ARG PORT=8080
ENV PORT $PORT
EXPOSE $PORT

RUN apk add --no-cache \
git

# install dependencies first, in a different location for easier app bind mounting for local development
WORKDIR /srv/app

COPY package.json package-lock.json* ./
RUN npm install

# copy in our source code last, as it changes the most
WORKDIR /srv/app
COPY . /srv/app

# if you want to use npm start instead, then use `docker run --init in production`
# so that signals are passed properly. Note the code in index.js is needed to catch Docker signals
# using node here is still more graceful stopping then npm with --init afaik
# I still can't come up with a good production way to run with npm and graceful shutdown
CMD [ "node", "bot.js" ]