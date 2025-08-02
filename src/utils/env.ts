import { z } from "zod";

export const env = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.string(),
    // Database configuration
    OTTOMAN_BUCKET_NAME: z.string(),
    OTTOMAN_CONNECTION_STRING: z.string(),
    OTTOMAN_USERNAME: z.string(),
    OTTOMAN_PASSWORD: z.string(),
    // JWT configuration
    JWT_SECRET: z.string(),
    // AWS Configuration
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_ACCESS_SECRET_KEY: z.string(),
    AWS_REGION: z.string(),
    // AWS SES Configuration
    AWS_SES_EMAIL_FROM: z.string(),
    AWS_SES_EMAIL_FROM_NAME: z.string(),
    // Nodemailer Configuration
    EMAIL_PROVIDER: z.enum(["gmail", "outlook", "smtp"]).optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    // R2 Bucket Configuration
    R2_BUCKET: z.string(),
    R2_ENDPOINT: z.string(),
    R2_REGION: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_BUCKET_URL: z.string(),
    // Redis Configuration
    REDIS_URI: z.string(),
});

export type Env = z.infer<typeof env>;

/**
 * Get parsed the environment variables
 */
export const config = env.parse(process.env);
