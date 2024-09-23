FROM node:20.17.0

WORKDIR /usr/src/app

COPY ./ ./

RUN npm install -g npm@10.8.1

RUN npm install -g @nestjs/cli

RUN npm ci

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
