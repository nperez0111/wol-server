FROM node:8-jessie

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY index.js .

EXPOSE 3078

CMD [ "node", "index.js" ]