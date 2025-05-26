# 1. Node.js LTS 이미지 사용
FROM node:18

# 2. 앱 루트 디렉토리로 이동
WORKDIR /app

# 3. 전체 복사 (Dockerfile 기준)
COPY . .

# 4. server 디렉토리로 이동
WORKDIR /app/server

# 5. 의존성 설치
RUN npm install

# 6. TypeScript 빌드
RUN npm run build

# 7. 앱 실행
CMD ["node", "dist/server.js"]
