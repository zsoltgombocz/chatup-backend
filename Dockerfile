FROM node:18-alpine

WORKDIR /app
COPY package*.json .

COPY tsconfig.json .

COPY src /app/src

RUN npm ci

CMD ["npm", "run", "start"]