import { Injectable } from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';
import {
  InvoiceNotFound,
  InvoiceAlreadyCancelled,
  StudentNotFound,
} from '../../common/exceptions/business.exceptions.js';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateInvoiceDto) {
    // Verify student belongs to school
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new StudentNotFound(dto.studentId);

    return this.prisma.$transaction(async (tx) => {
      // Fetch fee structures for the specified items
      const feeStructures = await tx.feeStructure.findMany({
        where: {
          id: { in: dto.feeStructureIds },
          schoolId,
          academicYearId: dto.academicYearId,
        },
      });

      if (feeStructures.length !== dto.feeStructureIds.length) {
        throw new Error(
          'One or more fee structures not found or do not belong to this school/academic year',
        );
      }

      // Calculate total
      const totalAmount = feeStructures.reduce(
        (sum, fs) => sum.add(fs.amount),
        new Prisma.Decimal(0),
      );

      // Generate invoice number: INV-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.invoice.count({
        where: { schoolId },
      });
      const invoiceNo = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // Create invoice with line items
      const invoice = await tx.invoice.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          academicYearId: dto.academicYearId,
          invoiceNo,
          totalAmount,
          dueDate: new Date(dto.dueDate),
          lineItems: {
            create: feeStructures.map((fs) => ({
              schoolId,
              feeStructureId: fs.id,
              amount: fs.amount,
              discount: 0,
              netAmount: fs.amount,
              description: fs.name || `${fs.feeType} Fee`,
            })),
          },
        },
        include: {
          lineItems: { include: { feeStructure: true } },
          student: true,
        },
      });

      await this.audit.log(
        {
          action: 'INVOICE_CREATED',
          entityName: 'Invoice',
          entityId: invoice.id,
          schoolId,
          newValues: invoice,
        },
        tx,
      );

      return invoice;
    });
  }

  async findAll(
    schoolId: string,
    pagination: PaginationDto,
    filters: { studentId?: string; status?: string; academicYearId?: string },
  ) {
    const where: any = { schoolId };
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status) where.status = filters.status;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { student: true, lineItems: true, payments: true },
        skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
        take: pagination.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(
      data,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  async findOne(schoolId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, schoolId },
      include: {
        student: true,
        lineItems: { include: { feeStructure: true } },
        payments: true,
      },
    });

    if (!invoice) throw new InvoiceNotFound(id);
    return invoice;
  }

  async cancel(schoolId: string, id: string) {
    const invoice = await this.findOne(schoolId, id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new InvoiceAlreadyCancelled(id);
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });

    await this.audit.log({
      action: 'INVOICE_CANCELLED',
      entityName: 'Invoice',
      entityId: id,
      schoolId,
      oldValues: invoice,
      newValues: updated,
    });

    return updated;
  }

  async updateInvoiceStatus(invoiceId: string, tx?: any) {
    const prisma = tx || this.prisma;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: { where: { status: 'COMPLETED' } } },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce(
      (sum: Prisma.Decimal, p: any) => sum.add(p.amount),
      new Prisma.Decimal(0),
    );

    let status: InvoiceStatus;
    if (totalPaid.gte(invoice.totalAmount)) {
      status = InvoiceStatus.PAID;
    } else if (totalPaid.gt(new Prisma.Decimal(0))) {
      status = InvoiceStatus.PARTIAL;
    } else {
      status = InvoiceStatus.UNPAID;
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount: totalPaid, status },
    });
  }
}
