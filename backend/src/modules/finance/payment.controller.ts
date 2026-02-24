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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { IdempotencyService } from './idempotency.service.js';
import { Role } from '@prisma/client';

@Controller({ path: 'schools/:schoolId/payments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Body() dto: CreatePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.idempotencyService.execute(
      dto.idempotencyKey,
      schoolId,
      'POST /payments',
      async () => {
        const payment = await this.paymentService.create(schoolId, dto);
        return { data: payment, statusCode: HttpStatus.CREATED };
      },
    );

    res.status(result.statusCode);
    return result.data;
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findAll(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Query() pagination: PaginationDto,
    @Query('invoiceId') invoiceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentService.findAll(schoolId, pagination, {
      invoiceId,
      paymentMethod,
      status,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findOne(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.paymentService.findOne(schoolId, id);
  }

  @Patch(':id/reverse')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  reverse(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.paymentService.reverse(schoolId, id);
  }
}
