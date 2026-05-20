import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import signalsRouter from "./signals";
import webhookRouter from "./webhook";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(webhookRouter);
router.use(meRouter);
router.use(signalsRouter);
router.use(adminRouter);

export default router;
