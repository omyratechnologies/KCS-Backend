import { FeedComment, IFeedComment } from "@/models/feed_comment.model";
import { Feed } from "@/models/feed.model";
import { FeedLike } from "@/models/feed_like.model";

export class FeedCommentService {
    // Create a new comment
    async createComment(data: {
        feed_id: string;
        content: string;
        author_id: string;
        author_type: "Student" | "Teacher" | "Admin" | "Super Admin";
        parent_comment_id?: string;
        attachments?: Array<{
            url: string;
            filename: string;
            file_type: string;
            file_size: number;
        }>;
    }): Promise<IFeedComment> {
        const comment = new FeedComment({
            ...data,
            likes_count: 0,
            replies_count: 0,
            is_deleted: false,
        });

        await comment.save();

        // Increment comment count on the feed
        await this.incrementFeedComments(data.feed_id);

        // If this is a reply, increment reply count on parent comment
        if (data.parent_comment_id) {
            await this.incrementCommentReplies(data.parent_comment_id);
        }

        return comment;
    }

    // Get comments for a feed
    async getFeedComments(params: {
        feed_id: string;
        parent_comment_id?: string;
        page?: number;
        limit?: number;
        user_id?: string;
    }): Promise<{ comments: IFeedComment[]; total: number; page: number; limit: number }> {
        const { feed_id, parent_comment_id = null, page = 1, limit = 20, user_id } = params;

        const conditions: Record<string, any> = {
            feed_id,
            is_deleted: false,
        };

        // Only add parent_comment_id if it's not null
        if (parent_comment_id !== null) {
            conditions.parent_comment_id = parent_comment_id;
        }

        const offset = (page - 1) * limit;

        try {
            const commentsQuery = await FeedComment.find(conditions, {
                sort: { created_at: "DESC" },
                limit: limit,
                skip: offset
            });

            const comments = commentsQuery.rows || [];
            
            // Get total count
            const totalQuery = await FeedComment.find(conditions);
            const total = totalQuery.rows?.length || 0;

            // Add user interaction data if user_id provided
            const commentsWithInteractions = await Promise.all(
                comments.map(async (comment) => {
                    if (user_id) {
                        const isLiked = await this.isUserLikedComment(user_id, comment.id);
                        (comment as any).user_interactions = {
                            is_liked: isLiked,
                        };
                    }
                    return comment;
                })
            );

            return {
                comments: commentsWithInteractions,
                total,
                page,
                limit,
            };
        } catch (error) {
            throw new Error(`Failed to fetch comments: ${error}`);
        }
    }

    // Get single comment by ID
    async getCommentById(comment_id: string, user_id?: string): Promise<IFeedComment | null> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (!comment || comment.is_deleted) {
                return null;
            }

            // Add user interaction data if user_id provided
            if (user_id) {
                const isLiked = await this.isUserLikedComment(user_id, comment_id);
                (comment as any).user_interactions = {
                    is_liked: isLiked,
                };
            }

            return comment;
        } catch (error) {
            throw new Error(`Failed to fetch comment: ${error}`);
        }
    }

    // Update comment
    async updateComment(comment_id: string, author_id: string, data: Partial<IFeedComment>): Promise<IFeedComment | null> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (!comment || comment.is_deleted) {
                throw new Error("Comment not found");
            }

            if (comment.author_id !== author_id) {
                throw new Error("Unauthorized to update this comment");
            }

            // Update allowed fields
            const allowedFields = ['content', 'attachments'];
            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    comment[field] = data[field];
                }
            });

            comment.updated_at = new Date();
            await comment.save();

            return comment;
        } catch (error) {
            throw new Error(`Failed to update comment: ${error}`);
        }
    }

    // Soft delete comment
    async deleteComment(comment_id: string, deleted_by: string, user_type: string): Promise<boolean> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (!comment || comment.is_deleted) {
                throw new Error("Comment not found");
            }

            // Check permissions
            const canDelete = await this.canUserDeleteComment(deleted_by, user_type, comment);
            if (!canDelete) {
                throw new Error("Unauthorized to delete this comment");
            }

            comment.is_deleted = true;
            comment.deleted_by = deleted_by;
            comment.deleted_at = new Date();
            await comment.save();

            // Decrement comment count on the feed
            await this.decrementFeedComments(comment.feed_id);

            // If this is a reply, decrement reply count on parent comment
            if (comment.parent_comment_id) {
                await this.decrementCommentReplies(comment.parent_comment_id);
            }

            return true;
        } catch (error) {
            throw new Error(`Failed to delete comment: ${error}`);
        }
    }

    // Like/Unlike comment
    async toggleLikeComment(comment_id: string, user_id: string, user_type: string): Promise<boolean> {
        try {
            const existingLikeQuery = await FeedLike.find({ comment_id, user_id });
            const existingLike = existingLikeQuery.rows?.[0];
            
            if (existingLike) {
                // Unlike
                await FeedLike.removeById(existingLike.id);
                await this.decrementCommentLikes(comment_id);
                return false;
            } else {
                // Like
                const like = new FeedLike({
                    comment_id,
                    user_id,
                    user_type,
                });
                await like.save();
                await this.incrementCommentLikes(comment_id);
                return true;
            }
        } catch (error) {
            throw new Error(`Failed to toggle like: ${error}`);
        }
    }

    // Helper methods
    private async canUserDeleteComment(user_id: string, user_type: string, comment: IFeedComment): Promise<boolean> {
        // Super Admin and Admin can delete any comment
        if (["Super Admin", "Admin"].includes(user_type)) {
            return true;
        }

        // Teachers can delete student comments
        if (user_type === "Teacher" && comment.author_type === "Student") {
            return true;
        }

        // Users can delete their own comments
        return comment.author_id === user_id;
    }

    private async isUserLikedComment(user_id: string, comment_id: string): Promise<boolean> {
        try {
            const likeQuery = await FeedLike.find({ user_id, comment_id });
            return (likeQuery.rows?.length || 0) > 0;
        } catch {
            return false;
        }
    }

    private async incrementFeedComments(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.comments_count = (feed.comments_count || 0) + 1;
                await feed.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }

    private async decrementFeedComments(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.comments_count = Math.max((feed.comments_count || 1) - 1, 0);
                await feed.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }

    private async incrementCommentReplies(comment_id: string): Promise<void> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (comment) {
                comment.replies_count = (comment.replies_count || 0) + 1;
                await comment.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }

    private async decrementCommentReplies(comment_id: string): Promise<void> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (comment) {
                comment.replies_count = Math.max((comment.replies_count || 1) - 1, 0);
                await comment.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }

    private async incrementCommentLikes(comment_id: string): Promise<void> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (comment) {
                comment.likes_count = (comment.likes_count || 0) + 1;
                await comment.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }

    private async decrementCommentLikes(comment_id: string): Promise<void> {
        try {
            const comment = await FeedComment.findById(comment_id);
            if (comment) {
                comment.likes_count = Math.max((comment.likes_count || 1) - 1, 0);
                await comment.save();
            }
        } catch (error) {
            // Handle error silently or log it appropriately
        }
    }
}
