import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { InvoiceQueryDto } from './dto/invoice-query.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'finance/invoices', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(req.user.schoolId, dto);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoiceService.findAll(req.user.schoolId, query, {
      studentId: query.studentId,
      status: query.status,
      academicYearId: query.academicYearId,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.TEACHER)
  findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.findOne(req.user.schoolId, id);
  }

  @Patch(':id/cancel')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.cancel(req.user.schoolId, id);
  }
}
