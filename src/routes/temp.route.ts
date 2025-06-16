import { Hono } from "hono";

import { UserService } from "@/services/users.service";

const app = new Hono();

app.post("/create-admin", async (c) => {
    const { username, password } = await c.req.json();
    const user = await UserService.createUsers({
        user_id: username,
        email: `${username}@${username}.com`,
        password,
        first_name: " ",
        last_name: " ",
        phone: "0000000000",
        address: " ",
        meta_data: "{}",
        user_type: "Super Admin",
        campus_id: "",
    });
    return c.json(user);
});

export default app;
