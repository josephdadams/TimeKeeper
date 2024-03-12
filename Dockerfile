FROM node:18.19.1-alpine

WORKDIR /app
COPY package*.json ./
RUN npm i
EXPOSE 4000
CMD ["node", "main.js"]