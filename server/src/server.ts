import express, {Request, Response} from "express";
import morgan from "morgan";
import {AppDataSource} from "./data-source";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.get("/", (_: Request, res: Response) => {
    res.send("running")
});

let port = 4000;
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);

    AppDataSource.initialize().then(() => {
            console.log("database initialized")
        }
    )
})
