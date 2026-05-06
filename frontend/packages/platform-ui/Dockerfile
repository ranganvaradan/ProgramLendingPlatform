FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY packages/platform-ui ./packages/platform-ui
RUN npm install
WORKDIR /app/packages/platform-ui
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/packages/platform-ui/dist /usr/share/nginx/html
COPY packages/platform-ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
