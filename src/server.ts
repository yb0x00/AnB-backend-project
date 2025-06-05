process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // 서버 환경에서는 일반적으로 처리되지 않은 거부는 프로세스를 종료하는 것이 좋습니다.
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    // 처리되지 않은 예외 발생 시 프로세스를 종료합니다.
    process.exit(1);
});

import express from "express";
import morgan from "morgan";
import 'reflect-metadata';
import {seedUsers} from "./seed/seed_users";
import {seedProperties} from "./seed/seed_properties";
import authRoutes from "./routes/auth.routes";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notification.routes";
import {User} from "./entities/User";
import {AppDataSource} from "@/data-source";
import requestContractRoutes from "./routes/contractRequest/create.routes";
import acceptContractRequest from "./routes/contractRequest/accept.routes";
import getContractRequest from "./routes/contractCreation/get.routes";
import writeDetailRoutes from "@/routes/contractCreation/writeDetail.routes";
import getDetailRoutes from "@/routes/contractCreation/getDetail.routes";
import getActiveRoutes from "@/routes/contractCreation/getActive.routes";
import webhookRoutes from "@/routes/payment/stripe/webhook";
import signatureRoutes from "@/routes/signature.routes";
import paymentDownRoutes from "@/routes/payment/stripe/paymentDown.routes";

dotenv.config();

const app = express();

app.use("/api", webhookRoutes);

app.use(express.json());
app.use(morgan("dev"));

// app.get("/test", (req, res) => {
//     console.log("Test route hit");
//     res.send("OK");
// });

app.use("/api", authRoutes);
app.use("/api", notificationRoutes);
app.use("/api", requestContractRoutes);
app.use("/api", acceptContractRequest);
app.use("/api", getContractRequest);
app.use("/api", writeDetailRoutes);
app.use("/api", getDetailRoutes);
app.use("/api", getActiveRoutes);
app.use("/api", signatureRoutes);
app.use("/api", paymentDownRoutes);

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