import express from "express";
import morgan from "morgan";
import {AppDataSource} from "./data-source";
import 'reflect-metadata';
import {seedUsers} from "./seed/seed_users";
import {seedProperties} from "./seed/seed_properties";
import authRoutes from "./routes/auth.routes";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notification.routes";
import {User} from "./entities/User";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use("/api", authRoutes);
app.use("/api", notificationRoutes);

let port = Number(process.env.PORT) || 4000;

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database initialized");

        // 배포 환경에서만 실행, 단 최초 1회만
        if (process.env.NODE_ENV === "production") {
            const userRepo = AppDataSource.getRepository(User);
            const userCount = await userRepo.count();

            if (userCount === 0) {
                console.log("Running seed in production (first-time only)");
                await seedUsers();
                await seedProperties();
            } else {
                console.log("Seed already applied in production. Skipping.");
            }
        } else {
            console.log("Running seed in development");
            await seedUsers();
            await seedProperties();
        }

        app.listen(port, "0.0.0.0", () => {
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