"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JourneyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const LIVE_KEY = (sessionId) => `journey:live:${sessionId}`;
const LIVE_INDEX = 'journey:live:index';
const LIVE_TTL_SECONDS = 60 * 30;
const ACTIVE_STEPS = [
    client_1.JourneyStep.LEFT_HOME,
    client_1.JourneyStep.REACHED,
    client_1.JourneyStep.CLASS_STARTED,
];
let JourneyService = JourneyService_1 = class JourneyService {
    prisma;
    redis;
    logger = new common_1.Logger(JourneyService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getForTutor(sessionId, userId) {
        const session = await this.loadOnlineSessionForTutor(sessionId, userId);
        const journey = await this.ensureJourney(session.id);
        return this.toPublic(session, journey);
    }
    async leaveHome(sessionId, userId, dto) {
        return this.advance(sessionId, userId, client_1.JourneyStep.LEFT_HOME, dto);
    }
    async reach(sessionId, userId, dto) {
        return this.advance(sessionId, userId, client_1.JourneyStep.REACHED, dto);
    }
    async startClass(sessionId, userId, dto) {
        return this.advance(sessionId, userId, client_1.JourneyStep.CLASS_STARTED, dto);
    }
    async stop(sessionId, userId, dto) {
        return this.advance(sessionId, userId, client_1.JourneyStep.STOPPED, dto);
    }
    async pingLive(sessionId, userId, dto) {
        const session = await this.loadOnlineSessionForTutor(sessionId, userId);
        const journey = await this.ensureJourney(session.id);
        if (!ACTIVE_STEPS.includes(journey.step)) {
            throw new common_1.BadRequestException('Live location is only while the journey is in progress (after leave, before stop).');
        }
        const recordedAt = new Date();
        await this.prisma.journeyLocationEvent.create({
            data: {
                sessionId: session.id,
                journeyId: journey.id,
                kind: client_1.JourneyEventKind.LIVE_PING,
                step: journey.step,
                lat: dto.lat,
                lng: dto.lng,
                recordedAt,
            },
        });
        await this.publishLive(session.id, journey.step, dto.lat, dto.lng);
        return {
            ok: true,
            step: journey.step,
            lat: dto.lat,
            lng: dto.lng,
            at: recordedAt.toISOString(),
            stored: true,
        };
    }
    async listLiveForCeo() {
        const sessions = await this.prisma.session.findMany({
            where: {
                mode: client_1.SessionMode.ONLINE,
                status: client_1.SessionStatus.SCHEDULED,
                journey: { step: { in: ACTIVE_STEPS } },
            },
            orderBy: { startsAt: 'asc' },
            include: {
                journey: true,
                tutorProfile: {
                    select: {
                        id: true,
                        user: { select: { id: true, fullName: true, phone: true } },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
            },
        });
        const items = [];
        for (const session of sessions) {
            if (!session.journey)
                continue;
            const live = await this.readLive(session.id);
            const lastKnown = live
                ? { lat: live.lat, lng: live.lng, at: live.at, source: 'live' }
                : this.lastKnownFromJourney(session.journey);
            items.push({
                sessionId: session.id,
                title: session.title,
                subjectName: session.subjectName,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                status: session.status,
                step: session.journey.step,
                tutor: {
                    tutorProfileId: session.tutorProfile.id,
                    fullName: session.tutorProfile.user.fullName,
                    phone: session.tutorProfile.user.phone,
                },
                student: session.student
                    ? {
                        id: session.student.id,
                        fullName: session.student.fullName,
                        className: session.student.className,
                        parentName: session.student.parent.user.fullName,
                    }
                    : null,
                leftHomeAt: session.journey.leftHomeAt,
                reachedAt: session.journey.reachedAt,
                classStartedAt: session.journey.classStartedAt,
                flow: this.buildFlow(session.journey),
                location: lastKnown,
                mapsUrl: this.mapsUrl(lastKnown?.lat, lastKnown?.lng),
            });
        }
        return {
            updatedAt: new Date().toISOString(),
            count: items.length,
            items,
        };
    }
    async listHistoryForCeo(limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const sessions = await this.prisma.session.findMany({
            where: {
                mode: client_1.SessionMode.ONLINE,
                journey: {
                    OR: [
                        { step: client_1.JourneyStep.STOPPED },
                        { leftHomeAt: { not: null } },
                    ],
                },
            },
            orderBy: [{ journey: { stoppedAt: 'desc' } }, { startsAt: 'desc' }],
            take,
            include: {
                journey: true,
                tutorProfile: {
                    select: {
                        id: true,
                        user: { select: { fullName: true, phone: true } },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
                _count: {
                    select: { journeyEvents: true },
                },
            },
        });
        return {
            updatedAt: new Date().toISOString(),
            count: sessions.length,
            items: sessions
                .filter((session) => session.journey)
                .map((session) => {
                const journey = session.journey;
                const lastKnown = this.lastKnownFromJourney(journey);
                return {
                    sessionId: session.id,
                    title: session.title,
                    subjectName: session.subjectName,
                    startsAt: session.startsAt,
                    endsAt: session.endsAt,
                    status: session.status,
                    step: journey.step,
                    tutor: {
                        tutorProfileId: session.tutorProfile.id,
                        fullName: session.tutorProfile.user.fullName,
                        phone: session.tutorProfile.user.phone,
                    },
                    student: session.student
                        ? {
                            id: session.student.id,
                            fullName: session.student.fullName,
                            className: session.student.className,
                            parentName: session.student.parent.user.fullName,
                        }
                        : null,
                    flow: this.buildFlow(journey),
                    eventCount: session._count.journeyEvents,
                    location: lastKnown,
                    mapsUrl: this.mapsUrl(lastKnown?.lat, lastKnown?.lng),
                };
            }),
        };
    }
    async getTrackingDetailForCeo(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                journey: true,
                tutorProfile: {
                    select: {
                        id: true,
                        user: { select: { fullName: true, phone: true } },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
                journeyEvents: {
                    orderBy: { recordedAt: 'asc' },
                    take: 500,
                },
            },
        });
        if (!session || session.mode !== client_1.SessionMode.ONLINE) {
            throw new common_1.NotFoundException('Online session not found.');
        }
        if (!session.journey) {
            throw new common_1.NotFoundException('No journey recorded for this session.');
        }
        const live = await this.readLive(session.id);
        const lastKnown = live
            ? { lat: live.lat, lng: live.lng, at: live.at, source: 'live' }
            : this.lastKnownFromJourney(session.journey);
        return {
            sessionId: session.id,
            title: session.title,
            subjectName: session.subjectName,
            startsAt: session.startsAt,
            endsAt: session.endsAt,
            status: session.status,
            step: session.journey.step,
            tutor: {
                tutorProfileId: session.tutorProfile.id,
                fullName: session.tutorProfile.user.fullName,
                phone: session.tutorProfile.user.phone,
            },
            student: session.student
                ? {
                    id: session.student.id,
                    fullName: session.student.fullName,
                    className: session.student.className,
                    parentName: session.student.parent.user.fullName,
                }
                : null,
            flow: this.buildFlow(session.journey),
            location: lastKnown,
            mapsUrl: this.mapsUrl(lastKnown?.lat, lastKnown?.lng),
            events: session.journeyEvents.map((event) => ({
                id: event.id,
                kind: event.kind,
                step: event.step,
                lat: event.lat,
                lng: event.lng,
                recordedAt: event.recordedAt,
                mapsUrl: this.mapsUrl(event.lat, event.lng),
            })),
        };
    }
    buildFlow(journey) {
        return [
            {
                step: client_1.JourneyStep.LEFT_HOME,
                label: 'Leave home',
                at: journey.leftHomeAt,
                lat: journey.leftHomeLat,
                lng: journey.leftHomeLng,
                mapsUrl: this.mapsUrl(journey.leftHomeLat, journey.leftHomeLng),
            },
            {
                step: client_1.JourneyStep.REACHED,
                label: 'Reach student',
                at: journey.reachedAt,
                lat: journey.reachedLat,
                lng: journey.reachedLng,
                mapsUrl: this.mapsUrl(journey.reachedLat, journey.reachedLng),
            },
            {
                step: client_1.JourneyStep.CLASS_STARTED,
                label: 'Start class',
                at: journey.classStartedAt,
                lat: journey.classStartedLat,
                lng: journey.classStartedLng,
                mapsUrl: this.mapsUrl(journey.classStartedLat, journey.classStartedLng),
            },
            {
                step: client_1.JourneyStep.STOPPED,
                label: 'Stop class',
                at: journey.stoppedAt,
                lat: journey.stoppedLat,
                lng: journey.stoppedLng,
                mapsUrl: this.mapsUrl(journey.stoppedLat, journey.stoppedLng),
            },
        ];
    }
    mapsUrl(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number')
            return null;
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    }
    lastKnownFromJourney(journey) {
        const candidates = [
            {
                lat: journey.stoppedLat ?? null,
                lng: journey.stoppedLng ?? null,
                at: journey.stoppedAt ?? null,
            },
            {
                lat: journey.classStartedLat,
                lng: journey.classStartedLng,
                at: journey.classStartedAt,
            },
            {
                lat: journey.reachedLat,
                lng: journey.reachedLng,
                at: journey.reachedAt,
            },
            {
                lat: journey.leftHomeLat,
                lng: journey.leftHomeLng,
                at: journey.leftHomeAt,
            },
        ];
        for (const c of candidates) {
            if (typeof c.lat === 'number' && typeof c.lng === 'number') {
                return {
                    lat: c.lat,
                    lng: c.lng,
                    at: c.at?.toISOString() ?? null,
                    source: 'checkpoint',
                };
            }
        }
        return null;
    }
    async publishLive(sessionId, step, lat, lng) {
        const payload = {
            sessionId,
            lat,
            lng,
            at: new Date().toISOString(),
            step,
        };
        const ok = await this.redis.set(LIVE_KEY(sessionId), JSON.stringify(payload), LIVE_TTL_SECONDS);
        if (ok) {
            await this.redis.sAdd(LIVE_INDEX, sessionId);
        }
        else {
            this.logger.warn(`Live location for ${sessionId} was not stored (Redis unavailable).`);
        }
    }
    async clearLive(sessionId) {
        await this.redis.del(LIVE_KEY(sessionId));
        await this.redis.sRem(LIVE_INDEX, sessionId);
    }
    async readLive(sessionId) {
        const raw = await this.redis.get(LIVE_KEY(sessionId));
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async advance(sessionId, userId, nextStep, dto) {
        const session = await this.loadOnlineSessionForTutor(sessionId, userId);
        if (session.status === client_1.SessionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot update journey on a cancelled session.');
        }
        const journey = await this.ensureJourney(session.id);
        const expectedFrom = this.requiredPrevious(nextStep);
        if (journey.step !== expectedFrom) {
            throw new common_1.BadRequestException(this.stepMismatchMessage(journey.step, nextStep));
        }
        const now = new Date();
        const loc = this.normalizeLocation(dto);
        const data = this.buildStepUpdate(nextStep, now, loc);
        const updated = await this.prisma.$transaction(async (tx) => {
            const nextJourney = await tx.sessionJourney.update({
                where: { id: journey.id },
                data,
            });
            await tx.journeyLocationEvent.create({
                data: {
                    sessionId: session.id,
                    journeyId: journey.id,
                    kind: client_1.JourneyEventKind.CHECKPOINT,
                    step: nextStep,
                    lat: loc.lat ?? null,
                    lng: loc.lng ?? null,
                    recordedAt: now,
                },
            });
            if (nextStep === client_1.JourneyStep.STOPPED) {
                await tx.session.update({
                    where: { id: session.id },
                    data: { status: client_1.SessionStatus.COMPLETED },
                });
            }
            return nextJourney;
        });
        if (nextStep === client_1.JourneyStep.STOPPED) {
            await this.clearLive(session.id);
        }
        else if (ACTIVE_STEPS.includes(nextStep) &&
            typeof loc.lat === 'number' &&
            typeof loc.lng === 'number') {
            await this.publishLive(session.id, nextStep, loc.lat, loc.lng);
        }
        const freshSession = await this.prisma.session.findUniqueOrThrow({
            where: { id: session.id },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
            },
        });
        return this.toPublic(freshSession, updated);
    }
    requiredPrevious(next) {
        switch (next) {
            case client_1.JourneyStep.LEFT_HOME:
                return client_1.JourneyStep.NOT_STARTED;
            case client_1.JourneyStep.REACHED:
                return client_1.JourneyStep.LEFT_HOME;
            case client_1.JourneyStep.CLASS_STARTED:
                return client_1.JourneyStep.REACHED;
            case client_1.JourneyStep.STOPPED:
                return client_1.JourneyStep.CLASS_STARTED;
            default:
                throw new common_1.BadRequestException('Invalid journey step.');
        }
    }
    stepMismatchMessage(current, next) {
        const labels = {
            NOT_STARTED: 'not started',
            LEFT_HOME: 'left home',
            REACHED: 'reached student',
            CLASS_STARTED: 'class started',
            STOPPED: 'stopped',
        };
        return `Cannot move to “${labels[next]}” from “${labels[current]}”. Follow leave → reach → start → stop.`;
    }
    buildStepUpdate(nextStep, now, loc) {
        switch (nextStep) {
            case client_1.JourneyStep.LEFT_HOME:
                return {
                    step: nextStep,
                    leftHomeAt: now,
                    leftHomeLat: loc.lat ?? null,
                    leftHomeLng: loc.lng ?? null,
                };
            case client_1.JourneyStep.REACHED:
                return {
                    step: nextStep,
                    reachedAt: now,
                    reachedLat: loc.lat ?? null,
                    reachedLng: loc.lng ?? null,
                };
            case client_1.JourneyStep.CLASS_STARTED:
                return {
                    step: nextStep,
                    classStartedAt: now,
                    classStartedLat: loc.lat ?? null,
                    classStartedLng: loc.lng ?? null,
                };
            case client_1.JourneyStep.STOPPED:
                return {
                    step: nextStep,
                    stoppedAt: now,
                    stoppedLat: loc.lat ?? null,
                    stoppedLng: loc.lng ?? null,
                };
            default:
                throw new common_1.BadRequestException('Invalid journey step.');
        }
    }
    normalizeLocation(dto) {
        const hasLat = typeof dto.lat === 'number';
        const hasLng = typeof dto.lng === 'number';
        if (hasLat !== hasLng) {
            throw new common_1.BadRequestException('Send both latitude and longitude, or neither.');
        }
        return {
            lat: hasLat ? dto.lat : undefined,
            lng: hasLng ? dto.lng : undefined,
        };
    }
    async ensureJourney(sessionId) {
        const existing = await this.prisma.sessionJourney.findUnique({
            where: { sessionId },
        });
        if (existing)
            return existing;
        return this.prisma.sessionJourney.create({
            data: { sessionId },
        });
    }
    async loadOnlineSessionForTutor(sessionId, userId) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
            include: { user: { select: { role: true } } },
        });
        if (!profile || profile.user.role !== client_1.UserRole.HOME_TUTOR) {
            throw new common_1.ForbiddenException('Only home tutors can update journeys.');
        }
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found.');
        }
        if (session.tutorProfileId !== profile.id) {
            throw new common_1.ForbiddenException('This session is not assigned to you.');
        }
        if (session.mode !== client_1.SessionMode.ONLINE) {
            throw new common_1.BadRequestException('Journey tracking is only for online home sessions.');
        }
        return session;
    }
    toPublic(session, journey) {
        return {
            session: {
                id: session.id,
                title: session.title,
                subjectName: session.subjectName,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                status: session.status,
                notes: session.notes,
                student: session.student
                    ? {
                        id: session.student.id,
                        fullName: session.student.fullName,
                        className: session.student.className,
                        parentName: session.student.parent.user.fullName,
                    }
                    : null,
            },
            journey: {
                step: journey.step,
                leftHomeAt: journey.leftHomeAt,
                leftHomeLat: journey.leftHomeLat,
                leftHomeLng: journey.leftHomeLng,
                reachedAt: journey.reachedAt,
                reachedLat: journey.reachedLat,
                reachedLng: journey.reachedLng,
                classStartedAt: journey.classStartedAt,
                classStartedLat: journey.classStartedLat,
                classStartedLng: journey.classStartedLng,
                stoppedAt: journey.stoppedAt,
                stoppedLat: journey.stoppedLat,
                stoppedLng: journey.stoppedLng,
                nextAction: this.nextAction(journey.step),
            },
        };
    }
    nextAction(step) {
        switch (step) {
            case client_1.JourneyStep.NOT_STARTED:
                return 'LEAVE_HOME';
            case client_1.JourneyStep.LEFT_HOME:
                return 'REACH';
            case client_1.JourneyStep.REACHED:
                return 'START_CLASS';
            case client_1.JourneyStep.CLASS_STARTED:
                return 'STOP';
            case client_1.JourneyStep.STOPPED:
                return null;
            default:
                return null;
        }
    }
};
exports.JourneyService = JourneyService;
exports.JourneyService = JourneyService = JourneyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], JourneyService);
//# sourceMappingURL=journey.service.js.map