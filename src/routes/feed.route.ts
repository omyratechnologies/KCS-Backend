import { Hono } from "hono";
import { FeedController } from "@/controllers/feed.controller";
import { studentFeedAccessMiddleware } from "@/middlewares/student_feed_access.middleware";

const app = new Hono();

// Apply student feed access middleware to all feed routes
app.use(studentFeedAccessMiddleware());

// ======================= FEED ROUTES =======================

// Create a new feed
app.post("/", FeedController.createFeed);

// Get feeds with filtering and pagination
app.get("/", FeedController.getFeeds);

// Get single feed by ID
app.get("/:id", FeedController.getFeedById);

// Update feed
app.put("/:id", FeedController.updateFeed);

// Delete feed (soft delete)
app.delete("/:id", FeedController.deleteFeed);

// Toggle pin feed (admin/teacher only)
app.patch("/:id/pin", FeedController.togglePinFeed);

// Like/Unlike feed
app.post("/:id/like", FeedController.toggleLikeFeed);

// Bookmark/Unbookmark feed
app.post("/:id/bookmark", FeedController.toggleBookmarkFeed);

// Get user bookmarks
app.get("/bookmarks/me", FeedController.getUserBookmarks);

// Vote on poll
app.post("/:id/vote", FeedController.voteOnPoll);

// Get poll results
app.get("/:id/poll-results", FeedController.getPollResults);

// Get shareable link
app.get("/:id/share", FeedController.getShareableLink);

// ======================= COMMENT ROUTES =======================

// Create comment on a feed
app.post("/:id/comments", FeedController.createComment);

// Get comments for a feed
app.get("/:id/comments", FeedController.getFeedComments);

// Update comment
app.put("/comments/:comment_id", FeedController.updateComment);

// Delete comment
app.delete("/comments/:comment_id", FeedController.deleteComment);

// Like/Unlike comment
app.post("/comments/:comment_id/like", FeedController.toggleLikeComment);

export default app;
