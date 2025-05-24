import express, {Request, Response} from "express";
import morgan from "morgan";
import {AppDataSource} from "./data-source";
import 'reflect-metadata';
import {seedUsers} from "../seed/seed_users";
import {seedProperties} from "../seed/seed_properties";
import authRoutes from "./routes/auth.routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use("/api", authRoutes);

let port = 4000;

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database initialized");

        await seedUsers();
        await seedProperties();

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to initialize database", error);
        process.exit(1);
    }
};

startServer().catch((err) => {
    console.error("서버 실행 중 에러 발생", err);
    process.exit(1);
});