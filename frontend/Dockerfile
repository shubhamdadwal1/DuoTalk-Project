FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_SOCKET_URL=
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN set -eu; \
    : > .env.production; \
    echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" >> .env.production; \
    if [ -n "$VITE_SOCKET_URL" ]; then echo "VITE_SOCKET_URL=$VITE_SOCKET_URL" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_API_KEY" ]; then echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_AUTH_DOMAIN" ]; then echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_PROJECT_ID" ]; then echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_STORAGE_BUCKET" ]; then echo "VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then echo "VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_APP_ID" ]; then echo "VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" >> .env.production; fi; \
    if [ -n "$VITE_FIREBASE_MEASUREMENT_ID" ]; then echo "VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID" >> .env.production; fi; \
    if [ -n "$VITE_GOOGLE_CLIENT_ID" ]; then echo "VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID" >> .env.production; fi; \
    if [ -n "$VITE_FACEBOOK_APP_ID" ]; then echo "VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID" >> .env.production; fi
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
