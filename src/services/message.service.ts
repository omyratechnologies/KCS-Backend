import {
    GroupMessageStore,
    IGroupMessageStore,
} from "../models/group_message_store.model";
import { IMessage, Message } from "../models/message.model";
import { IMessageGroup, MessageGroup } from "../models/message_group.model";

export class MessageService {
    // Store a message sent between two users
    public static async storeMessage(
        campus_id: string,
        from_user_id: string,
        to_user_id: string,
        message: string,
        meta_data: object
    ) {
        return await Message.create({
            campus_id,
            from_user_id,
            to_user_id,
            message,
            meta_data,
            is_deleted: false,
            is_seen: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // Get messages between two users
    public static async getMessages(
        campus_id: string,
        from_user_id: string,
        to_user_id: string
    ) {
        const messages: {
            rows: IMessage[];
        } = await Message.find(
            {
                campus_id,
                from_user_id,
                to_user_id,
                is_deleted: false,
            },
            {
                sort: { created_at: "DESC" },
            }
        );

        if (messages.rows.length === 0) {throw new Error("Messages not found");}

        return messages.rows;
    }

    // Update a message
    public static async updateMessage(id: string, data: Partial<IMessage>) {
        return await Message.updateById(id, data);
    }

    // Delete a message
    public static async deleteMessage(id: string) {
        return await Message.updateById(id, { is_deleted: true });
    }

    // Create a group
    public static async createGroup(
        campus_id: string,
        admin_user_id: string,
        group_name: string,
        group_description: string,
        members: string[],
        meta_data: object
    ) {
        return await MessageGroup.create({
            campus_id,
            group_name,
            admin_user_id,
            group_description,
            members,
            meta_data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // Get all groups for a user
    public static async getAllGroups(campus_id: string, user_id: string) {
        const groups: {
            rows: IMessageGroup[];
        } = await MessageGroup.find(
            {
                campus_id,
                $or: [{ admin_user_id: user_id }, { members: [user_id] }],
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (groups.rows.length === 0) {throw new Error("Groups not found");}

        return groups.rows;
    }

    // Get group by id
    public static async getGroupById(id: string) {
        const group = await MessageGroup.findById(id);

        if (!group) {throw new Error("Group not found");}

        return group;
    }

    // Update group
    public static async updateGroup(id: string, data: Partial<IMessageGroup>) {
        return await MessageGroup.updateById(id, data);
    }

    // Delete group
    public static async deleteGroup(id: string) {
        return await MessageGroup.updateById(id, { is_deleted: true });
    }

    // Add user to group
    public static async addUserToGroup(id: string, user_id: string) {
        return await MessageGroup.updateById(id, {
            $push: { members: user_id },
        });
    }

    // Remove user from group
    public static async removeUserFromGroup(id: string, user_id: string) {
        return await MessageGroup.updateById(id, {
            $pull: { members: user_id },
        });
    }

    // Get all messages in a group
    public static async getAllMessagesInGroup(id: string) {
        const messages: {
            rows: IGroupMessageStore[];
        } = await GroupMessageStore.find(
            {
                group_id: id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (messages.rows.length === 0) {throw new Error("Messages not found");}

        return messages.rows;
    }

    // Store a message in a group
    public static async storeMessageInGroup(
        group_id: string,
        user_id: string,
        message: string
    ) {
        return await GroupMessageStore.create({
            group_id,
            user_id,
            message,
            is_deleted: false,
        });
    }

    // Update a message in a group
    public static async updateMessageInGroup(id: string, message: string) {
        return await GroupMessageStore.updateById(id, { message });
    }

    // Delete a message in a group
    public static async deleteMessageInGroup(id: string) {
        return await GroupMessageStore.updateById(id, { is_deleted: true });
    }
}
