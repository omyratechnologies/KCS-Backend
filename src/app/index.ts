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
        origin: "*", // Allow all origins for development
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: false, // Note: credentials must be false when origin is "*"
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
