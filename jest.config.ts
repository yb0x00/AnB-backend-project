import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'], // 테스트 파일 경로
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};

export default config;
