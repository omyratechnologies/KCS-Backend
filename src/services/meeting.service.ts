import { IMeetingData, Meeting } from "@/models/meeting.model";

export class MeetingService {
    // create meeting
    public static readonly createMeeting = async (
        campus_id: string,
        creator_id: string,
        data: {
            participants: string[];
            meeting_name: string;
            meeting_description: string;
            meeting_start_time: Date;
            meeting_end_time: Date;
            meeting_location: string;
            meeting_meta_data: object;
        }
    ) => {
        const meeting = await Meeting.create({
            campus_id,
            creator_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!meeting) throw new Error("Meeting not created");

        return meeting;
    };

    // get all meetings by campus id and creator id
    public static readonly getAllMeetings = async (
        campus_id: string,
        creator_id: string
    ) => {
        const meetings: {
            rows: IMeetingData[];
        } = await Meeting.find(
            { campus_id, creator_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (meetings.rows.length === 0) throw new Error("Meetings not found");

        return meetings.rows;
    };

    // get meeting by id
    public static readonly getMeetingById = async (id: string) => {
        const meeting = await Meeting.findById(id);

        if (!meeting) throw new Error("Meeting not found");

        return meeting;
    };

    // get meeting by participant id
    public static readonly getMeetingByParticipantId = async (
        participant_id: string
    ) => {
        const meetings: {
            rows: IMeetingData[];
        } = await Meeting.find(
            {
                participants: participant_id,
                is_deleted: false,
            },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (meetings.rows.length === 0) throw new Error("Meetings not found");

        return meetings.rows;
    };

    // update meeting
    public static readonly updateMeeting = async (
        id: string,
        data: Partial<IMeetingData>
    ) => {
        const meeting = await Meeting.update(id, data);

        if (!meeting) throw new Error("Meeting not updated");

        return meeting;
    };

    // delete meeting
    public static readonly deleteMeeting = async (id: string) => {
        const meeting = await Meeting.update(id, { is_deleted: true });

        if (!meeting) throw new Error("Meeting not deleted");

        return meeting;
    };
}
