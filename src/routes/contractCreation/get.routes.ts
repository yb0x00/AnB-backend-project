import express from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {getContract} from "@/controllers/contractCreation/get.controller";

const router = express.Router();

router.get("/contracts/get", authenticate, getContract);

export default router;
