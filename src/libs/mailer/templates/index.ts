import fs from "node:fs/promises";

import Mustache from "mustache";

const getMailTemplate = async (): Promise<string> => {
    const htmlFiles = ["index", "header", "body", "footer"];
    const [indexHTML, headerHTML, bodyHTML, footerHTML] = await Promise.all(
        htmlFiles.map((fileName) =>
            fs.readFile(new URL(`base/${fileName}.html`, import.meta.url), "utf8")
        )
    );
    return await Mustache.render(indexHTML, {
        header: headerHTML,
        body: bodyHTML,
        footer: footerHTML,
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderMailContent = async (contentTemplate: string, body: any) => {
    const mainHTML = await getMailTemplate();
    const contentHTML = await Mustache.render(contentTemplate, { body });
    return await Mustache.render(mainHTML, {
        content: contentHTML,
    });
};
