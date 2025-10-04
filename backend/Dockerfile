FROM node:18-alpine
WORKDIR /app
COPY package.json package.json
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
