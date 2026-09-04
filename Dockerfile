# Multi-Stage Build für Frontend und Backend
FROM node:22-slim AS base

# Stage 1: Frontend bauen
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

ARG VITE_AUTH_API_URL
ARG VITE_TBA3_DATA_API_URL
ARG VITE_TEST_GROUP
ARG VITE_TEST_ID
ARG VITE_SURVEY_ID
ARG VITE_MATH_TEST_ID_A
ARG VITE_MATH_TEST_ID_B
ARG VITE_PDF_ENABLED

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_TBA3_DATA_API_URL=$VITE_TBA3_DATA_API_URL
ENV VITE_TEST_GROUP=$VITE_TEST_GROUP
ENV VITE_TEST_ID=$VITE_TEST_ID
ENV VITE_SURVEY_ID=$VITE_SURVEY_ID
ENV VITE_MATH_TEST_ID_A=$VITE_MATH_TEST_ID_A
ENV VITE_MATH_TEST_ID_B=$VITE_MATH_TEST_ID_B
ENV VITE_PDF_ENABLED=$VITE_PDF_ENABLED
RUN npm run build

# Stage 2: Production
FROM base

RUN apt-get update && apt-get install -y \
    firefox-esr \
    && rm -rf /var/lib/apt/lists/*

ARG FRONTEND_URL

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/firefox-esr
ENV FRONTEND_URL=$FRONTEND_URL

WORKDIR /app/backend
COPY backend/package*.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./frontend/
EXPOSE 3000
CMD ["node", "index.js"]

# Stage 2: Backend bauen
#FROM base AS backend-build
#WORKDIR /app/backend
#COPY backend/package*.json ./
#RUN npm ci --omit=dev
#COPY backend/ ./
#
## Stage 3: Production
#FROM nginx:alpine
#RUN apk add --no-cache nodejs npm firefox-esr
#ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/firefox-esr
#COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
#COPY --from=backend-build /app/backend /app/backend
#COPY nginx.conf /etc/nginx/nginx.conf
#COPY start.sh /start.sh
#RUN chmod +x /start.sh
#EXPOSE 80
#
#CMD ["/start.sh"]
