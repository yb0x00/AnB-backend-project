# 1. Node.js LTS 이미지 사용
FROM node:18

# 2. 앱 루트 디렉토리로 이동
WORKDIR /app

# 3. server 디렉토리 기준 전체 복사
COPY . .

# 4. 의존성 설치
RUN npm install

# 5. TypeScript 빌드
RUN npm run build

# 6. 앱 실행
CMD ["node", "dist/server.js"]
