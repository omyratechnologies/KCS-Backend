import { Context } from "hono";

import { IMeetingData } from "@/models/meeting.model";
import { MeetingService } from "@/services/meeting.service";

export class MeetingController {
    public static readonly createMeeting = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const creator_id = ctx.get("user_id");

            const {
                meeting_description,
                meeting_end_time,
                meeting_location,
                meeting_meta_data,
                meeting_name,
                meeting_start_time,
                participants,
            }: {
                participants: string[];
                meeting_name: string;
                meeting_description: string;
                meeting_start_time: Date;
                meeting_end_time: Date;
                meeting_location: string;
                meeting_meta_data: object;
            } = await ctx.req.json();

            const meeting = await MeetingService.createMeeting(
                campus_id,
                creator_id,
                {
                    meeting_description,
                    meeting_end_time,
                    meeting_location,
                    meeting_meta_data,
                    meeting_name,
                    meeting_start_time,
                    participants,
                }
            );

            return ctx.json(meeting);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
    public static readonly getAllMeetings = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const creator_id = ctx.get("user_id");

            const meetings = await MeetingService.getAllMeetings(
                campus_id,
                creator_id
            );

            return ctx.json(meetings);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
    public static readonly getMeetingById = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const meeting = await MeetingService.getMeetingById(meeting_id);

            return ctx.json(meeting);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
    public static readonly getMeetingByParticipantId = async (ctx: Context) => {
        try {
            const participant_id = ctx.get("user_id");

            const meeting =
                await MeetingService.getMeetingByParticipantId(participant_id);

            return ctx.json(meeting);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
    public static readonly updateMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const data: Partial<IMeetingData> = await ctx.req.json();

            const meeting = await MeetingService.updateMeeting(
                meeting_id,
                data
            );

            return ctx.json(meeting);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
    public static readonly deleteMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const meeting = await MeetingService.deleteMeeting(meeting_id);

            return ctx.json(meeting);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
}
