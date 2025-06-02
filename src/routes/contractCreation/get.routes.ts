import {Router} from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {getContractByPropertyController} from "@/controllers/contractCreation/get.controller";


const router = Router();

router.get("/contracts/by-property", authenticate, getContractByPropertyController);

export default router;
