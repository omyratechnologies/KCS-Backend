import { Feed, IFeed, FeedType, FeedVisibility } from "@/models/feed.model";
import { FeedLike } from "@/models/feed_like.model";
import { FeedBookmark } from "@/models/feed_bookmark.model";
import { FeedPollVote } from "@/models/feed_poll_vote.model";

export class FeedService {
    // Create a new feed
    async createFeed(data: {
        title?: string;
        content: string;
        type: FeedType;
        author_id: string;
        author_type: "Student" | "Teacher" | "Admin" | "Super Admin";
        campus_id: string;
        class_id?: string;
        subject_id?: string;
        visibility: FeedVisibility;
        tags?: string[];
        attachments?: Array<{
            url: string;
            filename: string;
            file_type: string;
            file_size: number;
        }>;
        metadata?: Record<string, unknown>;
    }): Promise<IFeed> {
        const feed = new Feed({
            ...data,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            bookmarks_count: 0,
            is_pinned: false,
            is_deleted: false,
        });

        await feed.save();
        return feed;
    }

    // Get feeds with filtering and pagination
    async getFeeds(params: {
        campus_id: string;
        user_id?: string;
        user_type?: string;
        class_id?: string;
        type?: FeedType;
        visibility?: FeedVisibility;
        tags?: string[];
        author_id?: string;
        page?: number;
        limit?: number;
        include_deleted?: boolean;
    }): Promise<{ feeds: IFeed[]; total: number; page: number; limit: number }> {
        const { 
            campus_id, 
            user_id, 
            user_type, 
            class_id, 
            type, 
            visibility, 
            tags, 
            author_id,
            page = 1, 
            limit = 20,
            include_deleted = false
        } = params;

        // Build query conditions
        const conditions: any = {
            campus_id,
        };

        if (!include_deleted) {
            conditions.is_deleted = false;
        }

        if (type) {
            conditions.type = type;
        }

        if (visibility) {
            conditions.visibility = visibility;
        }

        if (class_id) {
            conditions.class_id = class_id;
        }

        if (author_id) {
            conditions.author_id = author_id;
        }

        // For visibility filtering based on user access
        if (user_type === "Student" && !class_id) {
            // Students can only see public feeds or feeds from their classes
            conditions.$or = [
                { visibility: "public" },
                { visibility: "campus" },
                // We would need to join with user's class data for class-specific feeds
            ];
        }

        const offset = (page - 1) * limit;

        try {
            const feedsQuery = await Feed.find(conditions, {
                sort: {
                    is_pinned: "DESC",
                    created_at: "DESC"
                },
                limit: limit,
                skip: offset
            });

            const feeds = feedsQuery.rows || [];
            
            // Get total count
            const totalQuery = await Feed.find(conditions);
            const total = totalQuery.rows?.length || 0;

            return {
                feeds,
                total,
                page,
                limit,
            };
        } catch (error) {
            throw new Error(`Failed to fetch feeds: ${error}`);
        }
    }

    // Get single feed by ID
    async getFeedById(feed_id: string, user_id?: string): Promise<IFeed | null> {
        try {
            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted) {
                return null;
            }

            // Add user interaction data if user_id provided
            if (user_id) {
                const isLiked = await this.isUserLikedFeed(user_id, feed_id);
                const isBookmarked = await this.isUserBookmarkedFeed(user_id, feed_id);
                
                (feed as any).user_interactions = {
                    is_liked: isLiked,
                    is_bookmarked: isBookmarked,
                };
            }

            return feed;
        } catch (error) {
            throw new Error(`Failed to fetch feed: ${error}`);
        }
    }

    // Update feed
    async updateFeed(feed_id: string, author_id: string, data: Partial<IFeed>): Promise<IFeed | null> {
        try {
            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted) {
                throw new Error("Feed not found");
            }

            if (feed.author_id !== author_id) {
                throw new Error("Unauthorized to update this feed");
            }

            // Update allowed fields
            const allowedFields = ['title', 'content', 'tags', 'attachments', 'metadata', 'visibility'];
            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    feed[field] = data[field];
                }
            });

            feed.updated_at = new Date();
            await feed.save();

            return feed;
        } catch (error) {
            throw new Error(`Failed to update feed: ${error}`);
        }
    }

    // Soft delete feed
    async deleteFeed(feed_id: string, deleted_by: string, user_type: string): Promise<boolean> {
        try {
            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted) {
                throw new Error("Feed not found");
            }

            // Check permissions
            const canDelete = await this.canUserDeleteFeed(deleted_by, user_type, feed);
            if (!canDelete) {
                throw new Error("Unauthorized to delete this feed");
            }

            feed.is_deleted = true;
            feed.deleted_by = deleted_by;
            feed.deleted_at = new Date();
            await feed.save();

            return true;
        } catch (error) {
            throw new Error(`Failed to delete feed: ${error}`);
        }
    }

    // Pin/Unpin feed (admin/teacher only)
    async togglePinFeed(feed_id: string, user_id: string, user_type: string): Promise<boolean> {
        try {
            if (!["Admin", "Super Admin", "Teacher"].includes(user_type)) {
                throw new Error("Unauthorized to pin feeds");
            }

            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted) {
                throw new Error("Feed not found");
            }

            feed.is_pinned = !feed.is_pinned;
            feed.updated_at = new Date();
            await feed.save();

            return feed.is_pinned;
        } catch (error) {
            throw new Error(`Failed to toggle pin feed: ${error}`);
        }
    }

    // Like/Unlike feed
    async toggleLikeFeed(feed_id: string, user_id: string, user_type: string): Promise<boolean> {
        try {
            const existingLikeQuery = await FeedLike.find({ feed_id, user_id });
            const existingLike = existingLikeQuery.rows?.[0];
            
            if (existingLike) {
                // Unlike
                await FeedLike.removeById(existingLike.id);
                await this.decrementFeedLikes(feed_id);
                return false;
            } else {
                // Like
                const like = new FeedLike({
                    feed_id,
                    user_id,
                    user_type,
                });
                await like.save();
                await this.incrementFeedLikes(feed_id);
                return true;
            }
        } catch (error) {
            throw new Error(`Failed to toggle like: ${error}`);
        }
    }

    // Bookmark/Unbookmark feed
    async toggleBookmarkFeed(feed_id: string, user_id: string, user_type: string): Promise<boolean> {
        try {
            const existingBookmarkQuery = await FeedBookmark.find({ feed_id, user_id });
            const existingBookmark = existingBookmarkQuery.rows?.[0];
            
            if (existingBookmark) {
                // Remove bookmark
                await FeedBookmark.removeById(existingBookmark.id);
                await this.decrementFeedBookmarks(feed_id);
                return false;
            } else {
                // Add bookmark
                const bookmark = new FeedBookmark({
                    feed_id,
                    user_id,
                    user_type,
                });
                await bookmark.save();
                await this.incrementFeedBookmarks(feed_id);
                return true;
            }
        } catch (error) {
            throw new Error(`Failed to toggle bookmark: ${error}`);
        }
    }

    // Get user's bookmarked feeds
    async getUserBookmarks(user_id: string, page = 1, limit = 20): Promise<{ feeds: IFeed[]; total: number }> {
        try {
            const offset = (page - 1) * limit;
            
            const bookmarksQuery = await FeedBookmark.find({ user_id }, {
                sort: { created_at: "DESC" },
                limit: limit,
                skip: offset
            });

            const bookmarks = bookmarksQuery.rows || [];
            const feedIds = bookmarks.map(b => b.feed_id);
            
            const feedsQuery = await Feed.find({ 
                id: { $in: feedIds },
                is_deleted: false 
            });
            
            const feeds = feedsQuery.rows || [];

            const total = await FeedBookmark.count({ user_id });

            return { feeds: feeds || [], total: total || 0 };
        } catch (error) {
            throw new Error(`Failed to fetch bookmarks: ${error}`);
        }
    }

    // Vote on poll
    async voteOnPoll(feed_id: string, user_id: string, user_type: string, selected_options: string[]): Promise<boolean> {
        try {
            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted || feed.type !== "Poll") {
                throw new Error("Poll not found");
            }

            // Check if poll is expired
            if (feed.metadata?.poll_expires_at && new Date() > new Date(feed.metadata.poll_expires_at)) {
                throw new Error("Poll has expired");
            }

            // Check if user already voted
            const existingVoteQuery = await FeedPollVote.find({ feed_id, user_id });
            const existingVote = existingVoteQuery.rows?.[0];
            
            if (existingVote) {
                // Update existing vote
                existingVote.selected_options = selected_options;
                existingVote.updated_at = new Date();
                await existingVote.save();
            } else {
                // Create new vote
                const vote = new FeedPollVote({
                    feed_id,
                    user_id,
                    user_type,
                    selected_options,
                });
                await vote.save();
            }

            return true;
        } catch (error) {
            throw new Error(`Failed to vote on poll: ${error}`);
        }
    }

    // Get poll results
    async getPollResults(feed_id: string): Promise<{
        feed_id: string;
        poll_options: string[];
        results: Array<{
            option: string;
            votes: number;
            percentage: number;
        }>;
        total_votes: number;
        is_expired: boolean;
    }> {
        try {
            const feed = await Feed.findById(feed_id);
            if (!feed || feed.is_deleted || feed.type !== "Poll") {
                throw new Error("Poll not found");
            }

            const votesQuery = await FeedPollVote.find({ feed_id });
            const votes = votesQuery.rows || [];
            const pollOptions = feed.metadata?.poll_options || [];
            
            const results = pollOptions.map(option => ({
                option,
                votes: 0,
                percentage: 0,
            }));

            const totalVotes = votes.length;
            
            votes.forEach(vote => {
                vote.selected_options.forEach(option => {
                    const resultIndex = results.findIndex(r => r.option === option);
                    if (resultIndex !== -1) {
                        results[resultIndex].votes++;
                    }
                });
            });

            // Calculate percentages
            results.forEach(result => {
                result.percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
            });

            return {
                feed_id,
                poll_options: pollOptions,
                total_votes: totalVotes,
                results,
                is_expired: feed.metadata?.poll_expires_at ? new Date() > new Date(feed.metadata.poll_expires_at) : false,
            };
        } catch (error) {
            throw new Error(`Failed to get poll results: ${error}`);
        }
    }

    // Helper methods
    private async canUserDeleteFeed(user_id: string, user_type: string, feed: IFeed): Promise<boolean> {
        // Super Admin and Admin can delete any feed
        if (["Super Admin", "Admin"].includes(user_type)) {
            return true;
        }

        // Teachers can delete student feeds in their classes
        if (user_type === "Teacher" && feed.author_type === "Student") {
            // TODO: Check if teacher teaches the class where the feed was posted
            return true;
        }

        // Users can delete their own feeds
        return feed.author_id === user_id;
    }

    private async isUserLikedFeed(user_id: string, feed_id: string): Promise<boolean> {
        try {
            const like = await FeedLike.findOne({ user_id, feed_id });
            return !!like;
        } catch {
            return false;
        }
    }

    private async isUserBookmarkedFeed(user_id: string, feed_id: string): Promise<boolean> {
        try {
            const bookmark = await FeedBookmark.findOne({ user_id, feed_id });
            return !!bookmark;
        } catch {
            return false;
        }
    }

    private async incrementFeedLikes(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.likes_count = (feed.likes_count || 0) + 1;
                await feed.save();
            }
        } catch {
            // Silent fail for stats update
        }
    }

    private async decrementFeedLikes(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.likes_count = Math.max((feed.likes_count || 1) - 1, 0);
                await feed.save();
            }
        } catch {
            // Silent fail for stats update
        }
    }

    private async incrementFeedBookmarks(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.bookmarks_count = (feed.bookmarks_count || 0) + 1;
                await feed.save();
            }
        } catch {
            // Silent fail for stats update
        }
    }

    private async decrementFeedBookmarks(feed_id: string): Promise<void> {
        try {
            const feed = await Feed.findById(feed_id);
            if (feed) {
                feed.bookmarks_count = Math.max((feed.bookmarks_count || 1) - 1, 0);
                await feed.save();
            }
        } catch {
            // Silent fail for stats update
        }
    }
}
