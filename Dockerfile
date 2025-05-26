# ---- Builder Stage ----
# Node.js 18 버전을 사용하여 빌드 환경을 설정합니다.
FROM node:18 AS builder

# 작업 디렉토리를 /app으로 설정합니다.
WORKDIR /app

# package.json 및 package-lock.json 파일을 복사하여 의존성 설치를 준비합니다.
COPY package*.json ./

# 프로젝트 의존성을 설치합니다.
# tsconfig-paths와 같은 도구는 package.json에 정의되어 있다면 이 단계에서 설치됩니다.
RUN npm ci

# tsconfig.json 파일과 모든 소스 코드(src 폴더)를 빌드 환경으로 복사합니다.
COPY tsconfig.json ./
COPY src ./src

# TypeScript 코드를 JavaScript로 빌드합니다.
# 이 과정에서 src/ 폴더의 내용이 dist/ 폴더로 컴파일되며,
# tsconfig.json에 설정된 모든 경로 별칭 (paths)이 tsc-alias에 의해 해결됩니다.
RUN npm run build

# Seed 관련 JSON 파일만 빌드된 dist/seed/ 폴더로 복사합니다.
# TypeScript 파일들은 이미 빌드 단계에서 .js 파일로 컴파일되어 dist/ 에 있습니다.
# JSON 파일은 컴파일되지 않으므로 별도로 복사해야 합니다.
RUN mkdir -p dist/seed/ # dist/seed 폴더가 없을 경우를 대비하여 생성
COPY src/seed/properties_seed.json ./dist/seed/properties_seed.json
COPY src/seed/users_seed.json ./dist/seed/users_seed.json

# ---- Production Stage ----
# Node.js 18-alpine 버전을 사용하여 가볍고 운영에 적합한 최종 이미지를 구성합니다.
FROM node:18-alpine AS production

# 작업 디렉토리를 /app으로 설정합니다.
WORKDIR /app

# 보안 강화를 위해 비-루트 사용자 및 그룹을 생성하고 사용합니다.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 빌더 스테이지에서 생성된 빌드 결과물(dist 폴더),
# 운영에 필요한 node_modules, 그리고 package.json 파일을 현재 스테이지로 복사합니다.
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# 애플리케이션을 실행하는 명령을 정의합니다.
# 컴파일된 서버 진입점인 dist/server.js를 Node.js로 실행합니다.
CMD ["node", "dist/server.js"]