# ---- Builder Stage ----
FROM node:18 AS builder

WORKDIR /app

# package.json과 package-lock.json (또는 npm-shrinkwrap.json)을 먼저 복사
COPY package*.json ./

# 프로덕션 의존성만 설치하거나, 빌드에 필요한 devDependencies 포함하여 설치
# npm ci를 사용하면 package-lock.json을 기반으로 설치하여 더 일관된 빌드 가능
RUN npm ci
# 또는 개발 의존성이 빌드에 필요하다면:
# RUN npm install

COPY tsconfig.json ./
COPY src ./src
# jest.config.ts와 tests는 빌드에 필요하다면 복사
# COPY jest.config.ts ./
# COPY tests ./tests

RUN npm run build

# 프로덕션 의존성만 설치 (만약 위에서 모든 의존성을 설치했다면)
# RUN npm prune --production

# ---- Production Stage ----
FROM node:18-alpine AS production
# 또는 FROM node:18 AS production (alpine이 호환성 문제가 있다면)


WORKDIR /app

# Non-root 사용자 생성 및 사용
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Builder stage에서 빌드된 결과물과 node_modules 복사
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
# COPY --from=builder --chown=appuser:appgroup /app/.env ./ # .env는 이미지에 포함하지 않는 것을 권장

RUN mkdir -p dist/seed
COPY src/seed ./dist/seed

# 앱 실행
CMD ["node", "dist/server.js"]