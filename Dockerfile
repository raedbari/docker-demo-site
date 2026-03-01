FROM node:20-alpine

WORKDIR /app

COPY package.json ./ 
RUN npm install --omit=dev

COPY server.js ./ 
COPY public ./public 

RUN addgroup -S app && adduser -S app -G app 
USER app

EXPOSE 8089

CMD [ "node","server.js" ]
