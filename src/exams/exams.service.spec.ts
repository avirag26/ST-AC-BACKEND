import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Exam authorization and scoring', () => {
  const mark = {
    id: 'mark', subject: 'Math',
    exam: { startsAt: new Date('2020-01-01'), subjects: [{ name: 'Math', maxMarks: 50 }] },
  };
  const db = {
    exam: { findMany: jest.fn() },
    examMark: { findFirst: jest.fn(), update: jest.fn() },
  };
  const service = new ExamsService(db as unknown as PrismaService);
  beforeEach(() => { jest.resetAllMocks(); db.examMark.findFirst.mockResolvedValue(mark); });
  it('scopes both exam selection and returned marks to the parent', async () => {
    await service.list({ userId: 'parent', role: 'PARENT' });
    expect(db.exam.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { marks: { some: { student: { parent: { userId: 'parent' } } } } },
      include: expect.objectContaining({ marks: expect.objectContaining({ where: { student: { parent: { userId: 'parent' } } } }) }),
    }));
  });
  it('limits a teacher to their assigned exams', async () => {
    await service.mark({ userId: 'teacher', role: 'HOME_TUTOR' }, 'mark', { attendance: 'PRESENT', score: 40 });
    expect(db.examMark.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'mark', exam: { tutorProfile: { userId: 'teacher' } } } }));
  });
  it('does not update an inaccessible result', async () => {
    db.examMark.findFirst.mockResolvedValue(null);
    await expect(service.mark({ userId: 'other', role: 'HOME_TUTOR' }, 'mark', { attendance: 'PRESENT', score: 40 })).rejects.toThrow(NotFoundException);
    expect(db.examMark.update).not.toHaveBeenCalled();
  });
  it('rejects marks above the subject maximum', async () => {
    await expect(service.mark({ userId: 'teacher', role: 'HOME_TUTOR' }, 'mark', { attendance: 'PRESENT', score: 51 })).rejects.toThrow(BadRequestException);
    expect(db.examMark.update).not.toHaveBeenCalled();
  });
  it('rejects a score for an absent student', async () => {
    await expect(service.mark({ userId: 'teacher', role: 'HOME_TUTOR' }, 'mark', { attendance: 'ABSENT', score: 0 })).rejects.toThrow(BadRequestException);
  });
  it('accepts zero as a valid present score', async () => {
    await service.mark({ userId: 'teacher', role: 'HOME_TUTOR' }, 'mark', { attendance: 'PRESENT', score: 0 });
    expect(db.examMark.update).toHaveBeenCalledWith({ where: { id: 'mark' }, data: { attendance: 'PRESENT', score: 0, feedback: null } });
  });
  it('rejects marks before the exam starts', async () => {
    db.examMark.findFirst.mockResolvedValue({ ...mark, exam: { ...mark.exam, startsAt: new Date('2100-01-01') } });
    await expect(service.mark({ userId: 'teacher', role: 'HOME_TUTOR' }, 'mark', { attendance: 'PRESENT', score: 20 })).rejects.toThrow(BadRequestException);
  });
});
