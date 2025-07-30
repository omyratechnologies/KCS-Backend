import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { openAPISpecs } from "hono-openapi";

import log, { LogTypes } from "@/libs/logger";
import routes from "@/routes";
import { config } from "@/utils/env";

const app = new Hono();

app.use(
    cors({
        origin: (origin) => {
            // Allow requests from localhost and your domains
            const allowedOrigins = [
                "http://localhost:3000",
                "http://localhost:3001", 
                "http://localhost:5173",
                "https://dev.letscatchup-kcs.com",
                "https://letscatchup-kcs.com",
                "https://dev-api.letscatchup-kcs.com"
            ];
            
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return origin;
            
            // Check if origin is allowed
            if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
                return origin;
            }
            
            return null; // Reject origin
        },
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        maxAge: 3600,
    })
);

app.use(logger());
app.use(prettyJSON());
app.use(poweredBy());

app.get("/health", (ctx) => ctx.json({ status: "ok!" }));

app.get("/favicon.ico", async (ctx) => {
    return ctx.redirect("https://hono.dev/images/logo-small.png");
});

app.route("/api", routes);

app.get(
    "/openapi",
    openAPISpecs(app, {
        documentation: {
            info: {
                title: "KCS LMS API",
                version: "0.0.0",
                description: "API Documentation",
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
            servers: [
                {
                    url: "https://localhost:4500",
                    description: "Local server",
                },
                {
                    url: "https://dev-api.letscatchup-kcs.com",
                    description: "Production server",
                },
            ],
        },
    })
);

app.get(
    "/docs",
    Scalar({
        theme: "elysiajs",
        url: "/openapi",
        title: "KCS LMS API via Scalar",
    })
);

app.get(
    "/swagger",
    swaggerUI({
        url: "/openapi",
        title: "KCS LMS API via Swagger UI",
    })
);

showRoutes(app);

log(
    `Server started at http://localhost:${config.PORT}`,
    LogTypes.LOGS,
    "Entrypoint"
);

export { app };
