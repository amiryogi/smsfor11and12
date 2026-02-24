import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'schools/:schoolId/invoices', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(schoolId, dto);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findAll(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Query() pagination: PaginationDto,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.invoiceService.findAll(schoolId, pagination, {
      studentId,
      status,
      academicYearId,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.TEACHER)
  findOne(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.findOne(schoolId, id);
  }

  @Patch(':id/cancel')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.cancel(schoolId, id);
  }
}
