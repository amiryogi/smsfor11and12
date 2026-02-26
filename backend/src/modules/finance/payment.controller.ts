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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaymentQueryDto } from './dto/payment-query.dto.js';
import { IdempotencyService } from './idempotency.service.js';
import { Role } from '@prisma/client';

@Controller({ path: 'finance/payments', version: '1' })
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
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreatePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const schoolId = req.user.schoolId;
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
    @Request() req: { user: { schoolId: string } },
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentService.findAll(req.user.schoolId, query, {
      invoiceId: query.invoiceId,
      paymentMethod: query.paymentMethod,
      status: query.status,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.PARENT)
  findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.paymentService.findOne(req.user.schoolId, id);
  }

  @Post(':id/reverse')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  reverse(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.paymentService.reverse(req.user.schoolId, id);
  }
}
