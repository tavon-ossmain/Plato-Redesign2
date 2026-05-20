import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(webhookRouter);
router.use(signalsRouter);

export default router;
