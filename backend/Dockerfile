# backend/Dockerfile
FROM node:16

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y build-essential

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
