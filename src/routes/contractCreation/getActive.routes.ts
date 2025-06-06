import {Router} from "express";
import {getActiveContractsController} from "@/controllers/contractCreation/getActive.controller";
import {authenticate} from "@/middleware/auth.middleware";

const contractRouter = Router();

contractRouter.get("/contracts/awaiting-signature", authenticate, getActiveContractsController);

export default contractRouter;
