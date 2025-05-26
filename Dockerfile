# ---- Builder Stage ----
# Node.js 22 버전을 사용하여 빌드 환경을 설정합니다.
FROM node:22 AS builder

# 캐시 무효화를 위한 임시 라인. 빌드가 성공하면 제거합니다.
ARG CACHE_BUSTER=2

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# 디버깅 라인은 그대로 유지합니다.
RUN echo "--- Debugging: Contents of /app/src/seed/ after COPY src ./src ---"
RUN ls -l /app/src/seed/
RUN echo "------------------------------------------------------------------"

RUN npm run build

RUN mkdir -p dist/seed/
COPY src/seed/properties_seed.json ./dist/seed/properties_seed.json
COPY src/seed/users_seed.json ./dist/seed/users_seed.json

RUN echo "--- Debugging: Contents of /app/dist/seed/ after JSON COPY ---"
RUN ls -l /app/dist/seed/
RUN echo "------------------------------------------------------------"

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

CMD ["node", "dist/server.js"]