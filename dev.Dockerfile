# FROM node:16

# # Create app directory
# WORKDIR /usr/src/app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package*.json ./

# RUN npm install
# # If you are building your code for production
# # RUN npm ci --only=production

# # Bundle app source
# COPY . .
# COPY .env .

# EXPOSE 8888
# CMD [ "node", "server.js" ]

FROM node:16
RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY i7c7nmflgx9de8q
ENV PM2_SECRET_KEY 1sw088z8chmzyf8
WORKDIR /app
COPY package.json .
COPY pm2.dev.json pm2.json
# COPY ecosystem.config.js .
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
COPY . .
COPY .env .env
# RUN ls -al -R
EXPOSE 8888
# CMD [ "pm2-runtime", "start", "pm2.json" ]
CMD [ "pm2-runtime", "start", "pm2.json","--env=development" ]