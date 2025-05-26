# ---- Builder Stage ----
FROM node:18 AS builder

WORKDIR /app

# 의존성 설치용 파일 복사
COPY package*.json ./
COPY tsconfig.json ./

# 소스 코드 복사
COPY src ./src

# 의존성 설치 및 빌드
RUN npm ci
RUN npm run build

# seed 디렉토리 빌드 결과에 복사
RUN mkdir -p dist/seed && cp -r src/seed/* dist/seed/

# ---- Production Stage ----
FROM node:18-alpine AS production

WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 빌드 결과물만 복사
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# 앱 실행
CMD ["node", "dist/server.js"]
