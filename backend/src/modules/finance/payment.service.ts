import { Injectable } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { InvoiceService } from './invoice.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  PaymentNotFound,
  PaymentAlreadyReversed,
  PaymentExceedsBalance,
  InvoiceNotFound,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async create(schoolId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verify invoice belongs to school
      const invoice = await tx.invoice.findFirst({
        where: { id: dto.invoiceId, schoolId },
        include: { payments: { where: { status: PaymentStatus.COMPLETED } } },
      });

      if (!invoice) throw new InvoiceNotFound(dto.invoiceId);

      // Calculate remaining balance
      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );
      const remaining = invoice.totalAmount.sub(totalPaid);
      const paymentAmount = new Prisma.Decimal(dto.amount);

      if (paymentAmount.gt(remaining)) {
        throw new PaymentExceedsBalance(remaining.toNumber());
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          schoolId,
          studentId: invoice.studentId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          referenceNo: dto.referenceNo,
          notes: dto.notes,
        },
        include: { invoice: true },
      });

      // Update invoice status
      await this.invoiceService.updateInvoiceStatus(dto.invoiceId, tx);

      await this.audit.log(
        {
          action: 'PAYMENT_RECEIVED',
          entityName: 'Payment',
          entityId: payment.id,
          schoolId,
          newValues: payment,
        },
        tx,
      );

      return payment;
    });
  }

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    filters: { invoiceId?: string; paymentMethod?: string; status?: string },
  ) {
    const where: any = { schoolId };
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { invoice: { include: { student: true } } },
        skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
        take: pagination.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResponse(
      data,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  async findOne(schoolId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, schoolId },
      include: { invoice: { include: { student: true, lineItems: true } } },
    });

    if (!payment) throw new PaymentNotFound(id);
    return payment;
  }

  async reverse(schoolId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id, schoolId },
      });

      if (!payment) throw new PaymentNotFound(id);
      if (payment.status === PaymentStatus.REVERSED) {
        throw new PaymentAlreadyReversed();
      }

      const reversed = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REVERSED,
        },
      });

      // Recalculate invoice status
      if (payment.invoiceId) {
        await this.invoiceService.updateInvoiceStatus(payment.invoiceId, tx);
      }

      await this.audit.log(
        {
          action: 'PAYMENT_REVERSED',
          entityName: 'Payment',
          entityId: id,
          schoolId,
          oldValues: payment,
          newValues: reversed,
        },
        tx,
      );

      return reversed;
    });
  }
}
