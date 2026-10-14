import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, SubmitQuizDto } from './quizzes.dto';
import type { QuestionDto } from './quizzes.dto';
type Actor = { userId: string; role: string };
type Request = { user: Actor };
const manager = (actor: Actor) => ['CEO', 'ADMIN'].includes(actor.role);
@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}
  private studentsWhere(actor: Actor): Prisma.StudentWhereInput {
    if (manager(actor)) return {};
    return { OR: [
      { sessions: { some: { tutorProfile: { userId: actor.userId } } } },
      { batches: { some: { batch: { isActive: true, tutorProfile: { userId: actor.userId } } } } },
    ] };
  }
  options(actor: Actor) {
    return this.prisma.student.findMany({ where: this.studentsWhere(actor), select: { id: true, fullName: true, className: true }, orderBy: { fullName: 'asc' } });
  }
  async create(actor: Actor, dto: CreateQuizDto) {
    if (new Date(dto.dueAt) <= new Date()) throw new BadRequestException('Choose a future deadline.');
    if (!dto.title.trim() || dto.questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()) || q.correct >= q.options.length)) throw new BadRequestException('Complete each question, answer choice, and correct answer.');
    const count = await this.prisma.student.count({ where: { AND: [this.studentsWhere(actor), { id: { in: dto.studentIds } }] } });
    if (count !== dto.studentIds.length) throw new BadRequestException('Choose only students assigned to you.');
    return this.prisma.quiz.create({ data: { title: dto.title.trim(), dueAt: new Date(dto.dueAt), createdBy: actor.userId,
      questions: dto.questions.map((q) => ({ prompt: q.prompt.trim(), options: q.options.map((s) => s.trim()), correct: q.correct })),
      assignments: { create: dto.studentIds.map((studentId) => ({ studentId, answers: [] })) },
    }, select: { id: true } });
  }
  async list(actor: Actor) {
    const parent = actor.role === 'PARENT';
    const own = { student: { parent: { userId: actor.userId } } };
    const rows = await this.prisma.quiz.findMany({
      where: parent ? { assignments: { some: own } } : manager(actor) ? {} : { createdBy: actor.userId },
      orderBy: { dueAt: 'desc' },
      include: { assignments: { where: parent ? own : undefined, include: { student: { select: { fullName: true } } } } },
    });
    return rows.map((quiz) => ({ ...quiz, questions: (quiz.questions as unknown as QuestionDto[]).map((q) =>
      parent ? { prompt: q.prompt, options: q.options } : q) }));
  }
  async submit(actor: Actor, id: string, dto: SubmitQuizDto) {
    const assignment = await this.prisma.quizAssignment.findFirst({ where: { id, student: { parent: { userId: actor.userId } } }, include: { quiz: true } });
    if (!assignment) throw new NotFoundException('Quiz not found.');
    if (assignment.quiz.dueAt < new Date()) throw new BadRequestException('The quiz deadline has passed.');
    const questions = assignment.quiz.questions as unknown as QuestionDto[];
    if (dto.answers.length !== questions.length || dto.answers.some((answer, i) => answer >= questions[i].options.length)) throw new BadRequestException('Answer every question with a valid option.');
    const score = dto.answers.reduce((sum, answer, i) => sum + Number(answer === questions[i].correct), 0);
    const result = await this.prisma.quizAssignment.updateMany({ where: { id, submittedAt: null }, data: { answers: dto.answers, score, submittedAt: new Date() } });
    if (!result.count) throw new ConflictException('This quiz has already been submitted.');
    return { score, total: questions.length };
  }
}
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR, UserRole.PARENT)
class QuizzesController {
  constructor(private readonly service: QuizzesService) {}
  @Get() list(@Req() req: Request) { return this.service.list(req.user); }
  @Get('students') @Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR)
  students(@Req() req: Request) { return this.service.options(req.user); }
  @Post() @Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR)
  create(@Req() req: Request, @Body() dto: CreateQuizDto) { return this.service.create(req.user, dto); }
  @Post(':id/submit') @Roles(UserRole.PARENT)
  submit(@Req() req: Request, @Param('id') id: string, @Body() dto: SubmitQuizDto) { return this.service.submit(req.user, id, dto); }
}
@Module({ controllers: [QuizzesController], providers: [QuizzesService] })
export class QuizzesModule {}
