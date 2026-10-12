FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY scripts ./scripts
RUN npm install
COPY . .
ENV NODE_ENV=development PORT=3002
EXPOSE 3002
CMD ["npm", "run", "dev"]
