import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

function allowedOrigins(): string[] {
  return [
    process.env.APP_URL,
    process.env.MARKETING_SITE_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? "").split(","),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }

    const allowed = allowedOrigins();
    if (allowed.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "64kb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT ?? "64kb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api/assets", express.static(path.join(__dirname, "assets")));
app.use("/api", router);

// In production, serve the compiled frontend and handle SPA routing.
// The frontend build is expected at artifacts/platos-core/dist/public
// (override with FRONTEND_DIST env var if your layout differs).
if (process.env.NODE_ENV === "production") {
  const frontendDist = process.env["FRONTEND_DIST"]
    ? path.resolve(process.env["FRONTEND_DIST"])
    : path.join(__dirname, "../../platos-core/dist/public");

  app.use(express.static(frontendDist));

  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
