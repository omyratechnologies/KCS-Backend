import fs from "node:fs/promises";

import infoLogs, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

import { sendMail } from "./config";
import { renderMailContent } from "./templates";

const __dirname = new URL(".", import.meta.url).pathname;

const FROM_EMAIL = `${config.AWS_SES_EMAIL_FROM_NAME} <${config.AWS_SES_EMAIL_FROM}>`;

export const onForgotPassword = async (
    email: string,
    body: {
        code: string;
    }
) => {
    const contentTemplate = await fs.readFile(
        `${__dirname}/templates/leaflets/forgot_passwd.html`,
        "utf8"
    );
    const html = await renderMailContent(contentTemplate, body);
    const mail = {
        from: FROM_EMAIL,
        to: email,
        subject: "Reset your password",
        text: "Reset your password",
        html,
    };
    sendMail(mail)
        .then(() => {
            infoLogs(
                `Email sent to ${email}`,
                LogTypes.LOGS,
                "MAIL:FORGOTPASSWORD"
            );
        })
        .catch(() => {
            infoLogs(
                `Error sending email to ${email}`,
                LogTypes.ERROR,
                "MAIL:FORGOTPASSWORD"
            );
        });
};
