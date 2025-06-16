import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

import { config } from "@/utils/env";

const client = new SESv2Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_ACCESS_SECRET_KEY,
    },
});

export const sendMail = ({
    from,
    to,
    subject,
    text,
    html,
}: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
}) => {
    const input = {
        // SendEmailRequest
        FromEmailAddress: from,
        Destination: {
            // Destination
            ToAddresses: [
                // EmailAddressList
                to,
            ],
        },
        ReplyToAddresses: [from],
        Content: {
            // EmailContent
            Simple: {
                // Message
                Subject: {
                    // Content
                    Data: subject, // required
                },
                Body: {
                    // Body
                    Text: {
                        Data: text, // required
                    },
                    Html: {
                        Data: html, // required
                    },
                },
            },
        },
    };

    const command = new SendEmailCommand(input);
    return client.send(command);
};
