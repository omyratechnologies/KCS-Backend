import { Context } from "hono";
import { FeedService } from "@/services/feed.service";
import { FeedCommentService } from "@/services/feed_comment.service";
import { FeedType, FeedVisibility } from "@/models/feed.model";

const feedService = new FeedService();
const commentService = new FeedCommentService();

export class FeedController {
    // ======================= FEED ENDPOINTS =======================

    // Create a new feed
    public static readonly createFeed = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const data = await ctx.req.json();

            // Validate required fields
            if (!data.content || !data.type) {
                return ctx.json(
                    {
                        success: false,
                        error: "Content and type are required",
                    },
                    400
                );
            }

            // Validate feed type
            const validTypes: FeedType[] = ["Announcement", "Assignment", "Event", "Discussion", "Achievement", "Resource", "Poll"];
            if (!validTypes.includes(data.type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid feed type",
                    },
                    400
                );
            }

            // Validate visibility
            const validVisibilities: FeedVisibility[] = ["public", "class", "campus", "private"];
            if (data.visibility && !validVisibilities.includes(data.visibility)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid visibility",
                    },
                    400
                );
            }

            // For poll type, validate poll options
            if (data.type === "Poll") {
                if (!data.metadata?.poll_options || !Array.isArray(data.metadata.poll_options) || data.metadata.poll_options.length < 2) {
                    return ctx.json(
                        {
                            success: false,
                            error: "Poll must have at least 2 options",
                        },
                        400
                    );
                }
            }

            const feed = await feedService.createFeed({
                title: data.title,
                content: data.content,
                type: data.type,
                author_id: user_id,
                author_type: user_type,
                campus_id,
                class_id: data.class_id,
                subject_id: data.subject_id,
                visibility: data.visibility || "public",
                tags: data.tags || [],
                attachments: data.attachments || [],
                metadata: data.metadata || {},
            });

            return ctx.json(
                {
                    success: true,
                    message: "Feed created successfully",
                    data: feed,
                },
                201
            );
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to create feed: ${error}`,
                },
                500
            );
        }
    };

    // Get feeds with filtering
    public static readonly getFeeds = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const allowed_feed_types = ctx.get("allowed_feed_types") as string[] | undefined;

            const {
                type,
                visibility,
                class_id,
                author_id,
                tags,
                page = "1",
                limit = "20",
                include_deleted = "false",
            } = ctx.req.query();

            const tagsArray = tags ? tags.split(",").map(tag => tag.trim()) : undefined;

            // For students, apply feed type restrictions
            if (user_type === "Student" && allowed_feed_types) {
                // If a specific type is requested, check if it's allowed
                if (type && !allowed_feed_types.includes(type)) {
                    return ctx.json({
                        success: true,
                        data: {
                            feeds: [],
                            total: 0,
                            page: parseInt(page),
                            limit: parseInt(limit)
                        }
                    });
                }
            }

            const result = await feedService.getFeeds({
                campus_id,
                user_id,
                user_type,
                type: type as FeedType,
                visibility: visibility as FeedVisibility,
                class_id,
                author_id,
                tags: tagsArray,
                page: parseInt(page),
                limit: parseInt(limit),
                include_deleted: include_deleted === "true",
            });

            // Filter results by allowed feed types for students (when no specific type was requested)
            if (user_type === "Student" && allowed_feed_types && !type) {
                result.feeds = result.feeds.filter(feed => allowed_feed_types.includes(feed.type));
                result.total = result.feeds.length;
            }

            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to fetch feeds: ${error}`,
                },
                500
            );
        }
    };

    // Get single feed by ID
    public static readonly getFeedById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");

            const feed = await feedService.getFeedById(id, user_id);

            if (!feed) {
                return ctx.json(
                    {
                        success: false,
                        error: "Feed not found",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: feed,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to fetch feed: ${error}`,
                },
                500
            );
        }
    };

    // Update feed
    public static readonly updateFeed = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const data = await ctx.req.json();

            const feed = await feedService.updateFeed(id, user_id, data);

            if (!feed) {
                return ctx.json(
                    {
                        success: false,
                        error: "Feed not found or unauthorized",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Feed updated successfully",
                data: feed,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to update feed: ${error}`,
                },
                500
            );
        }
    };

    // Delete feed
    public static readonly deleteFeed = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const success = await feedService.deleteFeed(id, user_id, user_type);

            if (!success) {
                return ctx.json(
                    {
                        success: false,
                        error: "Feed not found or unauthorized",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Feed deleted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to delete feed: ${error}`,
                },
                500
            );
        }
    };

    // Toggle pin feed
    public static readonly togglePinFeed = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const isPinned = await feedService.togglePinFeed(id, user_id, user_type);

            return ctx.json({
                success: true,
                message: `Feed ${isPinned ? "pinned" : "unpinned"} successfully`,
                data: { is_pinned: isPinned },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to toggle pin: ${error}`,
                },
                500
            );
        }
    };

    // Like/Unlike feed
    public static readonly toggleLikeFeed = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const isLiked = await feedService.toggleLikeFeed(id, user_id, user_type);

            return ctx.json({
                success: true,
                message: `Feed ${isLiked ? "liked" : "unliked"} successfully`,
                data: { is_liked: isLiked },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to toggle like: ${error}`,
                },
                500
            );
        }
    };

    // Bookmark/Unbookmark feed
    public static readonly toggleBookmarkFeed = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const isBookmarked = await feedService.toggleBookmarkFeed(id, user_id, user_type);

            return ctx.json({
                success: true,
                message: `Feed ${isBookmarked ? "bookmarked" : "unbookmarked"} successfully`,
                data: { is_bookmarked: isBookmarked },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to toggle bookmark: ${error}`,
                },
                500
            );
        }
    };

    // Get user bookmarks
    public static readonly getUserBookmarks = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { page = "1", limit = "20" } = ctx.req.query();

            const result = await feedService.getUserBookmarks(
                user_id,
                parseInt(page),
                parseInt(limit)
            );

            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to fetch bookmarks: ${error}`,
                },
                500
            );
        }
    };

    // Vote on poll
    public static readonly voteOnPoll = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { selected_options } = await ctx.req.json();

            if (!selected_options || !Array.isArray(selected_options) || selected_options.length === 0) {
                return ctx.json(
                    {
                        success: false,
                        error: "Selected options are required",
                    },
                    400
                );
            }

            const success = await feedService.voteOnPoll(id, user_id, user_type, selected_options);

            if (!success) {
                return ctx.json(
                    {
                        success: false,
                        error: "Failed to vote on poll",
                    },
                    400
                );
            }

            return ctx.json({
                success: true,
                message: "Vote submitted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to vote: ${error}`,
                },
                500
            );
        }
    };

    // Get poll results
    public static readonly getPollResults = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const results = await feedService.getPollResults(id);

            return ctx.json({
                success: true,
                data: results,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to get poll results: ${error}`,
                },
                500
            );
        }
    };

    // Get shareable link
    public static readonly getShareableLink = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const feed = await feedService.getFeedById(id);

            if (!feed) {
                return ctx.json(
                    {
                        success: false,
                        error: "Feed not found",
                    },
                    404
                );
            }

            // Generate shareable link (you might want to use your domain)
            const shareableLink = `${ctx.req.url.split("/api")[0]}/share/feed/${id}`;

            return ctx.json({
                success: true,
                data: {
                    shareable_link: shareableLink,
                    feed_title: feed.title || "Feed",
                    feed_type: feed.type,
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to generate shareable link: ${error}`,
                },
                500
            );
        }
    };

    // ======================= COMMENT ENDPOINTS =======================

    // Create comment
    public static readonly createComment = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param(); // feed_id
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const data = await ctx.req.json();

            if (!data.content) {
                return ctx.json(
                    {
                        success: false,
                        error: "Content is required",
                    },
                    400
                );
            }

            const comment = await commentService.createComment({
                feed_id: id,
                content: data.content,
                author_id: user_id,
                author_type: user_type,
                parent_comment_id: data.parent_comment_id,
                attachments: data.attachments || [],
            });

            return ctx.json(
                {
                    success: true,
                    message: "Comment created successfully",
                    data: comment,
                },
                201
            );
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to create comment: ${error}`,
                },
                500
            );
        }
    };

    // Get comments for a feed
    public static readonly getFeedComments = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param(); // feed_id
            const user_id = ctx.get("user_id");
            const { parent_comment_id, page = "1", limit = "20" } = ctx.req.query();

            const result = await commentService.getFeedComments({
                feed_id: id,
                parent_comment_id: parent_comment_id || undefined,
                page: parseInt(page),
                limit: parseInt(limit),
                user_id,
            });

            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to fetch comments: ${error}`,
                },
                500
            );
        }
    };

    // Update comment
    public static readonly updateComment = async (ctx: Context) => {
        try {
            const { comment_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const data = await ctx.req.json();

            const comment = await commentService.updateComment(comment_id, user_id, data);

            if (!comment) {
                return ctx.json(
                    {
                        success: false,
                        error: "Comment not found or unauthorized",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Comment updated successfully",
                data: comment,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to update comment: ${error}`,
                },
                500
            );
        }
    };

    // Delete comment
    public static readonly deleteComment = async (ctx: Context) => {
        try {
            const { comment_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const success = await commentService.deleteComment(comment_id, user_id, user_type);

            if (!success) {
                return ctx.json(
                    {
                        success: false,
                        error: "Comment not found or unauthorized",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Comment deleted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to delete comment: ${error}`,
                },
                500
            );
        }
    };

    // Like/Unlike comment
    public static readonly toggleLikeComment = async (ctx: Context) => {
        try {
            const { comment_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const isLiked = await commentService.toggleLikeComment(comment_id, user_id, user_type);

            return ctx.json({
                success: true,
                message: `Comment ${isLiked ? "liked" : "unliked"} successfully`,
                data: { is_liked: isLiked },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to toggle like: ${error}`,
                },
                500
            );
        }
    };
}
