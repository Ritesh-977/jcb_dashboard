FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled React app
COPY dist /usr/share/nginx/html

EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
