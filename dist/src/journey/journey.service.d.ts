import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JourneyLocationDto } from './dto/journey-location.dto';
import { LiveLocationDto } from './dto/live-location.dto';
export declare class JourneyService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    getForTutor(sessionId: string, userId: string): Promise<{
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
    leaveHome(sessionId: string, userId: string, dto: JourneyLocationDto): Promise<{
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
    reach(sessionId: string, userId: string, dto: JourneyLocationDto): Promise<{
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
    startClass(sessionId: string, userId: string, dto: JourneyLocationDto): Promise<{
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
    stop(sessionId: string, userId: string, dto: JourneyLocationDto): Promise<{
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
    pingLive(sessionId: string, userId: string, dto: LiveLocationDto): Promise<{
        ok: boolean;
        step: import("@prisma/client").$Enums.JourneyStep;
        lat: number;
        lng: number;
        at: string;
        stored: boolean;
    }>;
    listLiveForCeo(): Promise<{
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
    listHistoryForCeo(limit?: number): Promise<{
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
    getTrackingDetailForCeo(sessionId: string): Promise<{
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
    private buildFlow;
    private mapsUrl;
    private lastKnownFromJourney;
    private publishLive;
    private clearLive;
    private readLive;
    private advance;
    private requiredPrevious;
    private stepMismatchMessage;
    private buildStepUpdate;
    private normalizeLocation;
    private ensureJourney;
    private loadOnlineSessionForTutor;
    private toPublic;
    private nextAction;
}
