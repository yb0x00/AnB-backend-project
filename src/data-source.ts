import 'reflect-metadata';
import {DataSource} from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: isProduction ? process.env.DB_HOST : 'localhost',
    port: isProduction ? Number(process.env.DB_PORT) : 5432,
    username: isProduction ? process.env.DB_USERNAME : 'postgres',
    password: isProduction ? process.env.DB_PASSWORD : 'password',
    database: isProduction ? process.env.DB_DATABASE : 'postgres',
    ssl: isProduction ? {rejectUnauthorized: false} : false,
    synchronize: !isProduction,
    logging: !isProduction,
    entities: isProduction
        ? ['dist/entities/**/*.js']  // 배포: 빌드된 JS 경로
        : ['src/entities/**/*.ts'],  // 개발: TypeScript 경로
    migrations: isProduction
        ? ['dist/migration/**/*.js']
        : ['src/migration/**/*.ts'],
    subscribers: [],
});

export {AppDataSource};
