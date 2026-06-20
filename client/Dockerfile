# Frontend image: build static assets, serve with nginx.
# VITE_* vars are baked at build time, so they're passed as build args.
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000
ARG VITE_BOARD_ID=11111111-1111-1111-1111-111111111111
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BOARD_ID=$VITE_BOARD_ID

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
