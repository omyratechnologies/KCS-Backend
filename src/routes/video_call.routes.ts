import { Hono } from "hono";
import { VideoCallController } from "../controllers/video_call.controller";

const videoCallRoutes = new Hono();

// Create a new video call (generic)
videoCallRoutes.post("/", VideoCallController.createCall);

// Create dedicated audio call
videoCallRoutes.post("/audio", VideoCallController.createAudioCall);

// Create dedicated video call
videoCallRoutes.post("/video", VideoCallController.createVideoCall);

// Join an existing call
videoCallRoutes.post("/:call_id/join", VideoCallController.joinCall);

// End a call
videoCallRoutes.post("/:call_id/end", VideoCallController.endCall);

// Update call status (webhook/client updates)
videoCallRoutes.post("/:call_id/status", VideoCallController.updateCallStatus);

// Get call history for authenticated user
videoCallRoutes.get("/history", VideoCallController.getCallHistory);

// Get call details
videoCallRoutes.get("/:call_id", VideoCallController.getCallDetails);

export { videoCallRoutes };
