import { Hono } from "hono";

import { MessageController } from "@/controllers/message.controller";
import {} from "@/middlewares/role.middleware";

const app = new Hono();

app.post("/", MessageController.storeMessage);
app.get("/", MessageController.getMessages);
app.put("/:id", MessageController.updateMessage);
app.delete("/:id", MessageController.deleteMessage);
app.post("/group", MessageController.createGroup);
app.put("/group/:id", MessageController.updateGroup);
app.delete("/group/:id", MessageController.deleteGroup);
app.get("/group", MessageController.getAllGroups);
app.get("/group/:id", MessageController.getGroupById);
app.post("/group/:id/add", MessageController.addUserToGroup);
app.post("/group/:id/kick", MessageController.removeUserFromGroup);
app.get("/group/:id/messages", MessageController.getAllMessagesInGroup);
app.post("/group/:id/messages", MessageController.storeMessageInGroup);
app.put("/group/:id/messages", MessageController.updateMessageInGroup);
app.delete("/group/:id/messages", MessageController.deleteMessageInGroup);

export default app;
