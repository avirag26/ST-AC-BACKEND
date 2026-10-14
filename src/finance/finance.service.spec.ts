import { BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
describe('Fee payment accounting', () => {
  const tx = { payment: { findUnique: jest.fn(), create: jest.fn() }, fee: { findUnique: jest.fn() } };
  const db = { $transaction: jest.fn(), fee: { findMany: jest.fn() } };
  const service = new FinanceService(db as unknown as PrismaService);
  const actor = { userId: 'ceo', role: 'CEO' };
  beforeEach(() => {
    jest.resetAllMocks();
    db.$transaction.mockImplementation((fn: (arg: typeof tx) => unknown) => fn(tx));
    tx.payment.findUnique.mockResolvedValue(null);
    tx.fee.findUnique.mockResolvedValue({ amount: 10000, payments: [{ amount: 6000 }] });
  });
  it('rejects an overpayment', async () => {
    await expect(service.pay(actor, 'fee', { amount: 4001, reference: 'receipt', requestId: 'request1' })).rejects.toThrow(BadRequestException);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
  it('accepts payment of the remaining balance with serializable isolation', async () => {
    await service.pay(actor, 'fee', { amount: 4000, reference: 'receipt', requestId: 'request1' });
    expect(tx.payment.create).toHaveBeenCalledWith({ data: { feeId: 'fee', amount: 4000, reference: 'receipt', requestId: 'request1', recordedBy: 'ceo' } });
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });
  it('does not charge twice on the same request', async () => {
    const existing = { feeId: 'fee', amount: 4000, recordedBy: 'ceo' };
    tx.payment.findUnique.mockResolvedValue(existing);
    expect(await service.pay(actor, 'fee', { amount: 4000, reference: 'receipt', requestId: 'request1' })).toEqual(existing);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
  it('filters parent fees by family ownership', async () => {
    db.fee.findMany.mockResolvedValue([]);
    await service.fees({ userId: 'parent', role: 'PARENT' });
    expect(db.fee.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { student: { parent: { userId: 'parent' } } } }));
  });
});
