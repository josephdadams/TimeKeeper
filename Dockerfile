FROM node:18.19.1-alpine

WORKDIR /app
RUN apk add --update nodejs npm \
    && npm i \

EXPOSE 4000
CMD ["node", "main.js"]
