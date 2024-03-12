FROM node:18.19.1-alpine

COPY package*.json ./
RUN npm i
EXPOSE 4000
CMD ["node", "main.js"]