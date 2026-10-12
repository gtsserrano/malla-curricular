FROM node:22-alpine

WORKDIR /app

# Instalar dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
