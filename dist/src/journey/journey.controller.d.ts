import type { Request } from 'express';
import { JourneyLocationDto } from './dto/journey-location.dto';
import { LiveLocationDto } from './dto/live-location.dto';
import { JourneyService } from './journey.service';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class JourneyController {
    private readonly journeyService;
    constructor(journeyService: JourneyService);
    listLive(): Promise<{
        updatedAt: string;
        count: number;
        items: {
            sessionId: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            step: import("@prisma/client").$Enums.JourneyStep;
            tutor: {
                tutorProfileId: string;
                fullName: string;
                phone: string | null;
            };
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            flow: ({
                step: "LEFT_HOME";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "REACHED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "CLASS_STARTED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "STOPPED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            })[];
            location: {
                lat: number;
                lng: number;
                at: string | null;
                source: "checkpoint";
            } | {
                lat: number;
                lng: number;
                at: string;
                source: "live";
            } | null;
            mapsUrl: string | null;
        }[];
    }>;
    listHistory(): Promise<{
        updatedAt: string;
        count: number;
        items: {
            sessionId: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            step: import("@prisma/client").$Enums.JourneyStep;
            tutor: {
                tutorProfileId: string;
                fullName: string;
                phone: string | null;
            };
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
            flow: ({
                step: "LEFT_HOME";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "REACHED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "CLASS_STARTED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            } | {
                step: "STOPPED";
                label: string;
                at: Date | null;
                lat: number | null;
                lng: number | null;
                mapsUrl: string | null;
            })[];
            eventCount: number;
            location: {
                lat: number;
                lng: number;
                at: string | null;
                source: "checkpoint";
            } | null;
            mapsUrl: string | null;
        }[];
    }>;
    getDetail(sessionId: string): Promise<{
        sessionId: string;
        title: string | null;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        status: import("@prisma/client").$Enums.SessionStatus;
        step: import("@prisma/client").$Enums.JourneyStep;
        tutor: {
            tutorProfileId: string;
            fullName: string;
            phone: string | null;
        };
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
        } | null;
        flow: ({
            step: "LEFT_HOME";
            label: string;
            at: Date | null;
            lat: number | null;
            lng: number | null;
            mapsUrl: string | null;
        } | {
            step: "REACHED";
            label: string;
            at: Date | null;
            lat: number | null;
            lng: number | null;
            mapsUrl: string | null;
        } | {
            step: "CLASS_STARTED";
            label: string;
            at: Date | null;
            lat: number | null;
            lng: number | null;
            mapsUrl: string | null;
        } | {
            step: "STOPPED";
            label: string;
            at: Date | null;
            lat: number | null;
            lng: number | null;
            mapsUrl: string | null;
        })[];
        location: {
            lat: number;
            lng: number;
            at: string | null;
            source: "checkpoint";
        } | {
            lat: number;
            lng: number;
            at: string;
            source: "live";
        } | null;
        mapsUrl: string | null;
        events: {
            id: string;
            kind: import("@prisma/client").$Enums.JourneyEventKind;
            step: import("@prisma/client").$Enums.JourneyStep;
            lat: number | null;
            lng: number | null;
            recordedAt: Date;
            mapsUrl: string | null;
        }[];
    }>;
    get(id: string, req: AuthRequest): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        journey: {
            step: import("@prisma/client").$Enums.JourneyStep;
            leftHomeAt: Date | null;
            leftHomeLat: number | null;
            leftHomeLng: number | null;
            reachedAt: Date | null;
            reachedLat: number | null;
            reachedLng: number | null;
            classStartedAt: Date | null;
            classStartedLat: number | null;
            classStartedLng: number | null;
            stoppedAt: Date | null;
            stoppedLat: number | null;
            stoppedLng: number | null;
            nextAction: string | null;
        };
    }>;
    leave(id: string, req: AuthRequest, dto: JourneyLocationDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        journey: {
            step: import("@prisma/client").$Enums.JourneyStep;
            leftHomeAt: Date | null;
            leftHomeLat: number | null;
            leftHomeLng: number | null;
            reachedAt: Date | null;
            reachedLat: number | null;
            reachedLng: number | null;
            classStartedAt: Date | null;
            classStartedLat: number | null;
            classStartedLng: number | null;
            stoppedAt: Date | null;
            stoppedLat: number | null;
            stoppedLng: number | null;
            nextAction: string | null;
        };
    }>;
    reach(id: string, req: AuthRequest, dto: JourneyLocationDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        journey: {
            step: import("@prisma/client").$Enums.JourneyStep;
            leftHomeAt: Date | null;
            leftHomeLat: number | null;
            leftHomeLng: number | null;
            reachedAt: Date | null;
            reachedLat: number | null;
            reachedLng: number | null;
            classStartedAt: Date | null;
            classStartedLat: number | null;
            classStartedLng: number | null;
            stoppedAt: Date | null;
            stoppedLat: number | null;
            stoppedLng: number | null;
            nextAction: string | null;
        };
    }>;
    start(id: string, req: AuthRequest, dto: JourneyLocationDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        journey: {
            step: import("@prisma/client").$Enums.JourneyStep;
            leftHomeAt: Date | null;
            leftHomeLat: number | null;
            leftHomeLng: number | null;
            reachedAt: Date | null;
            reachedLat: number | null;
            reachedLng: number | null;
            classStartedAt: Date | null;
            classStartedLat: number | null;
            classStartedLng: number | null;
            stoppedAt: Date | null;
            stoppedLat: number | null;
            stoppedLng: number | null;
            nextAction: string | null;
        };
    }>;
    stop(id: string, req: AuthRequest, dto: JourneyLocationDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        journey: {
            step: import("@prisma/client").$Enums.JourneyStep;
            leftHomeAt: Date | null;
            leftHomeLat: number | null;
            leftHomeLng: number | null;
            reachedAt: Date | null;
            reachedLat: number | null;
            reachedLng: number | null;
            classStartedAt: Date | null;
            classStartedLat: number | null;
            classStartedLng: number | null;
            stoppedAt: Date | null;
            stoppedLat: number | null;
            stoppedLng: number | null;
            nextAction: string | null;
        };
    }>;
    ping(id: string, req: AuthRequest, dto: LiveLocationDto): Promise<{
        ok: boolean;
        step: import("@prisma/client").$Enums.JourneyStep;
        lat: number;
        lng: number;
        at: string;
        stored: boolean;
    }>;
}
export {};
