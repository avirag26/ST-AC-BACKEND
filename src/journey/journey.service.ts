import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  JourneyEventKind,
  JourneyStep,
  SessionMode,
  SessionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JourneyLocationDto } from './dto/journey-location.dto';
import { LiveLocationDto } from './dto/live-location.dto';

type LocationInput = {
  lat?: number;
  lng?: number;
};

type LivePing = {
  sessionId: string;
  lat: number;
  lng: number;
  at: string;
  step: JourneyStep;
};

const LIVE_KEY = (sessionId: string) => `journey:live:${sessionId}`;
const LIVE_INDEX = 'journey:live:index';
const LIVE_TTL_SECONDS = 60 * 30;

const ACTIVE_STEPS: JourneyStep[] = [
  JourneyStep.LEFT_HOME,
  JourneyStep.REACHED,
  JourneyStep.CLASS_STARTED,
];

@Injectable()
export class JourneyService {
  private readonly logger = new Logger(JourneyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getForTutor(sessionId: string, userId: string) {
    const session = await this.loadOnlineSessionForTutor(sessionId, userId);
    const journey = await this.ensureJourney(session.id);
    return this.toPublic(session, journey);
  }

  async leaveHome(sessionId: string, userId: string, dto: JourneyLocationDto) {
    return this.advance(sessionId, userId, JourneyStep.LEFT_HOME, dto);
  }

  async reach(sessionId: string, userId: string, dto: JourneyLocationDto) {
    return this.advance(sessionId, userId, JourneyStep.REACHED, dto);
  }

  async startClass(sessionId: string, userId: string, dto: JourneyLocationDto) {
    return this.advance(sessionId, userId, JourneyStep.CLASS_STARTED, dto);
  }

  async stop(sessionId: string, userId: string, dto: JourneyLocationDto) {
    return this.advance(sessionId, userId, JourneyStep.STOPPED, dto);
  }

  async pingLive(sessionId: string, userId: string, dto: LiveLocationDto) {
    const session = await this.loadOnlineSessionForTutor(sessionId, userId);
    const journey = await this.ensureJourney(session.id);

    if (!ACTIVE_STEPS.includes(journey.step)) {
      throw new BadRequestException(
        'Live location is only while the journey is in progress (after leave, before stop).',
      );
    }

    const recordedAt = new Date();
    await this.prisma.journeyLocationEvent.create({
      data: {
        sessionId: session.id,
        journeyId: journey.id,
        kind: JourneyEventKind.LIVE_PING,
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
        mode: SessionMode.ONLINE,
        status: SessionStatus.SCHEDULED,
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
      if (!session.journey) continue;
      const live = await this.readLive(session.id);
      const lastKnown = live
        ? { lat: live.lat, lng: live.lng, at: live.at, source: 'live' as const }
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
        mode: SessionMode.ONLINE,
        journey: {
          OR: [
            { step: JourneyStep.STOPPED },
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
          const journey = session.journey!;
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

  async getTrackingDetailForCeo(sessionId: string) {
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

    if (!session || session.mode !== SessionMode.ONLINE) {
      throw new NotFoundException('Online session not found.');
    }
    if (!session.journey) {
      throw new NotFoundException('No journey recorded for this session.');
    }

    const live = await this.readLive(session.id);
    const lastKnown = live
      ? { lat: live.lat, lng: live.lng, at: live.at, source: 'live' as const }
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

  private buildFlow(journey: {
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
  }) {
    return [
      {
        step: JourneyStep.LEFT_HOME,
        label: 'Leave home',
        at: journey.leftHomeAt,
        lat: journey.leftHomeLat,
        lng: journey.leftHomeLng,
        mapsUrl: this.mapsUrl(journey.leftHomeLat, journey.leftHomeLng),
      },
      {
        step: JourneyStep.REACHED,
        label: 'Reach student',
        at: journey.reachedAt,
        lat: journey.reachedLat,
        lng: journey.reachedLng,
        mapsUrl: this.mapsUrl(journey.reachedLat, journey.reachedLng),
      },
      {
        step: JourneyStep.CLASS_STARTED,
        label: 'Start class',
        at: journey.classStartedAt,
        lat: journey.classStartedLat,
        lng: journey.classStartedLng,
        mapsUrl: this.mapsUrl(journey.classStartedLat, journey.classStartedLng),
      },
      {
        step: JourneyStep.STOPPED,
        label: 'Stop class',
        at: journey.stoppedAt,
        lat: journey.stoppedLat,
        lng: journey.stoppedLng,
        mapsUrl: this.mapsUrl(journey.stoppedLat, journey.stoppedLng),
      },
    ];
  }

  private mapsUrl(lat?: number | null, lng?: number | null) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }

  private lastKnownFromJourney(journey: {
    step: JourneyStep;
    leftHomeAt: Date | null;
    leftHomeLat: number | null;
    leftHomeLng: number | null;
    reachedAt: Date | null;
    reachedLat: number | null;
    reachedLng: number | null;
    classStartedAt: Date | null;
    classStartedLat: number | null;
    classStartedLng: number | null;
    stoppedAt?: Date | null;
    stoppedLat?: number | null;
    stoppedLng?: number | null;
  }) {
    const candidates: {
      lat: number | null;
      lng: number | null;
      at: Date | null;
    }[] = [
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
          source: 'checkpoint' as const,
        };
      }
    }
    return null;
  }

  private async publishLive(
    sessionId: string,
    step: JourneyStep,
    lat: number,
    lng: number,
  ) {
    const payload: LivePing = {
      sessionId,
      lat,
      lng,
      at: new Date().toISOString(),
      step,
    };
    const ok = await this.redis.set(
      LIVE_KEY(sessionId),
      JSON.stringify(payload),
      LIVE_TTL_SECONDS,
    );
    if (ok) {
      await this.redis.sAdd(LIVE_INDEX, sessionId);
    } else {
      this.logger.warn(
        `Live location for ${sessionId} was not stored (Redis unavailable).`,
      );
    }
  }

  private async clearLive(sessionId: string) {
    await this.redis.del(LIVE_KEY(sessionId));
    await this.redis.sRem(LIVE_INDEX, sessionId);
  }

  private async readLive(sessionId: string): Promise<LivePing | null> {
    const raw = await this.redis.get(LIVE_KEY(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LivePing;
    } catch {
      return null;
    }
  }

  private async advance(
    sessionId: string,
    userId: string,
    nextStep: JourneyStep,
    dto: JourneyLocationDto,
  ) {
    const session = await this.loadOnlineSessionForTutor(sessionId, userId);

    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot update journey on a cancelled session.',
      );
    }

    const journey = await this.ensureJourney(session.id);
    const expectedFrom = this.requiredPrevious(nextStep);

    if (journey.step !== expectedFrom) {
      throw new BadRequestException(
        this.stepMismatchMessage(journey.step, nextStep),
      );
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
          kind: JourneyEventKind.CHECKPOINT,
          step: nextStep,
          lat: loc.lat ?? null,
          lng: loc.lng ?? null,
          recordedAt: now,
        },
      });

      if (nextStep === JourneyStep.STOPPED) {
        await tx.session.update({
          where: { id: session.id },
          data: { status: SessionStatus.COMPLETED },
        });
      }

      return nextJourney;
    });

    if (nextStep === JourneyStep.STOPPED) {
      await this.clearLive(session.id);
    } else if (
      ACTIVE_STEPS.includes(nextStep) &&
      typeof loc.lat === 'number' &&
      typeof loc.lng === 'number'
    ) {
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

  private requiredPrevious(next: JourneyStep): JourneyStep {
    switch (next) {
      case JourneyStep.LEFT_HOME:
        return JourneyStep.NOT_STARTED;
      case JourneyStep.REACHED:
        return JourneyStep.LEFT_HOME;
      case JourneyStep.CLASS_STARTED:
        return JourneyStep.REACHED;
      case JourneyStep.STOPPED:
        return JourneyStep.CLASS_STARTED;
      default:
        throw new BadRequestException('Invalid journey step.');
    }
  }

  private stepMismatchMessage(current: JourneyStep, next: JourneyStep) {
    const labels: Record<JourneyStep, string> = {
      NOT_STARTED: 'not started',
      LEFT_HOME: 'left home',
      REACHED: 'reached student',
      CLASS_STARTED: 'class started',
      STOPPED: 'stopped',
    };
    return `Cannot move to “${labels[next]}” from “${labels[current]}”. Follow leave → reach → start → stop.`;
  }

  private buildStepUpdate(
    nextStep: JourneyStep,
    now: Date,
    loc: LocationInput,
  ) {
    switch (nextStep) {
      case JourneyStep.LEFT_HOME:
        return {
          step: nextStep,
          leftHomeAt: now,
          leftHomeLat: loc.lat ?? null,
          leftHomeLng: loc.lng ?? null,
        };
      case JourneyStep.REACHED:
        return {
          step: nextStep,
          reachedAt: now,
          reachedLat: loc.lat ?? null,
          reachedLng: loc.lng ?? null,
        };
      case JourneyStep.CLASS_STARTED:
        return {
          step: nextStep,
          classStartedAt: now,
          classStartedLat: loc.lat ?? null,
          classStartedLng: loc.lng ?? null,
        };
      case JourneyStep.STOPPED:
        return {
          step: nextStep,
          stoppedAt: now,
          stoppedLat: loc.lat ?? null,
          stoppedLng: loc.lng ?? null,
        };
      default:
        throw new BadRequestException('Invalid journey step.');
    }
  }

  private normalizeLocation(dto: JourneyLocationDto): LocationInput {
    const hasLat = typeof dto.lat === 'number';
    const hasLng = typeof dto.lng === 'number';
    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Send both latitude and longitude, or neither.',
      );
    }
    return {
      lat: hasLat ? dto.lat : undefined,
      lng: hasLng ? dto.lng : undefined,
    };
  }

  private async ensureJourney(sessionId: string) {
    const existing = await this.prisma.sessionJourney.findUnique({
      where: { sessionId },
    });
    if (existing) return existing;
    return this.prisma.sessionJourney.create({
      data: { sessionId },
    });
  }

  private async loadOnlineSessionForTutor(sessionId: string, userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { user: { select: { role: true } } },
    });

    if (!profile || profile.user.role !== UserRole.HOME_TUTOR) {
      throw new ForbiddenException('Only home tutors can update journeys.');
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
      throw new NotFoundException('Session not found.');
    }

    if (session.tutorProfileId !== profile.id) {
      throw new ForbiddenException('This session is not assigned to you.');
    }

    if (session.mode !== SessionMode.ONLINE) {
      throw new BadRequestException(
        'Journey tracking is only for online home sessions.',
      );
    }

    return session;
  }

  private toPublic(
    session: {
      id: string;
      title: string | null;
      subjectName: string | null;
      startsAt: Date;
      endsAt: Date;
      status: SessionStatus;
      notes: string | null;
      student: {
        id: string;
        fullName: string;
        className: string | null;
        parent: { user: { fullName: string } };
      } | null;
    },
    journey: {
      step: JourneyStep;
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
    },
  ) {
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

  private nextAction(step: JourneyStep) {
    switch (step) {
      case JourneyStep.NOT_STARTED:
        return 'LEAVE_HOME';
      case JourneyStep.LEFT_HOME:
        return 'REACH';
      case JourneyStep.REACHED:
        return 'START_CLASS';
      case JourneyStep.CLASS_STARTED:
        return 'STOP';
      case JourneyStep.STOPPED:
        return null;
      default:
        return null;
    }
  }
}
