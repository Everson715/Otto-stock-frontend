# Estágio 1: Build da aplicação React
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Argumentos de build para variável de ambiente
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Executar build
RUN npm run build

# Estágio 2: Nginx para servir arquivos estáticos
FROM nginx:alpine

# Copiar arquivos estáticos para o diretório padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta (opcional mas boa prática para documentar)
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
