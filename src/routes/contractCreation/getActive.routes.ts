import {Router} from "express";
import {getActiveContractsController} from "@/controllers/contractCreation/getActive.controller";

const contractRouter = Router();

contractRouter.get("/contracts/awaiting-signature", getActiveContractsController);

export default contractRouter;
