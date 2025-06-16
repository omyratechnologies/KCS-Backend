import { Context } from "hono";

import { MessageService } from "@/services/message.service";

export class MessageController {
    public static readonly storeMessage = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const from_user_id = ctx.get("user_id");

            const { to_user_id, message, meta_data } = await ctx.req.json();

            const newMessage = await MessageService.storeMessage(
                campus_id,
                from_user_id,
                to_user_id,
                message,
                meta_data
            );

            return ctx.json(newMessage);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getMessages = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const to_user_id = ctx.get("user_id");

            const { from_user_id } = await ctx.req.json();

            const messages = await MessageService.getMessages(
                campus_id,
                from_user_id,
                to_user_id
            );

            return ctx.json(messages);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateMessage = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const { message } = await ctx.req.json();

            const updatedMessage = await MessageService.updateMessage(id, {
                message,
            });

            return ctx.json(updatedMessage);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteMessage = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const deletedMessage = await MessageService.deleteMessage(id);

            return ctx.json(deletedMessage);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly createGroup = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { group_name, group_description, members, meta_data } =
                await ctx.req.json();

            const group = await MessageService.createGroup(
                campus_id,
                user_id,
                group_name,
                group_description,
                members,
                meta_data
            );

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getAllGroups = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const groups = await MessageService.getAllGroups(
                campus_id,
                user_id
            );

            return ctx.json(groups);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getGroupById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const group = await MessageService.getGroupById(id);

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const { group_name, group_description, members, meta_data } =
                await ctx.req.json();

            const group = await MessageService.updateGroup(id, {
                group_name,
                group_description,
                members,
                meta_data,
            });

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const group = await MessageService.deleteGroup(id);

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly addUserToGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const { user_id } = await ctx.req.json();

            const group = await MessageService.addUserToGroup(id, user_id);

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly removeUserFromGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const { user_id } = await ctx.req.json();

            const group = await MessageService.removeUserFromGroup(id, user_id);

            return ctx.json(group);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getAllMessagesInGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const messages = await MessageService.getAllMessagesInGroup(id);

            return ctx.json(messages);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly storeMessageInGroup = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { id } = ctx.req.param();
            const { message } = await ctx.req.json();

            const result = await MessageService.storeMessageInGroup(
                id,
                user_id,
                message
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateMessageInGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const { message } = await ctx.req.json();

            const result = await MessageService.updateMessageInGroup(
                id,
                message
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteMessageInGroup = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const result = await MessageService.deleteMessageInGroup(id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
