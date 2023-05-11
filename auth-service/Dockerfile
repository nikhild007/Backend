FROM node:alpine
WORKDIR /backend
COPY package*.json ./
RUN npm install
COPY . .
CMD node /backend/auth-service/index.js