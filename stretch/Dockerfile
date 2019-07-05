FROM node:12-stretch-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY index.js .

EXPOSE 3078

CMD [ "node", "index.js" ]