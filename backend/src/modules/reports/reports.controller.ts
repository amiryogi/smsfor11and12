import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'schools/:schoolId/reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('marksheet/:studentId/:examId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.ACCEPTED)
  generateMarksheet(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Param('examId', ParseUuidPipe) examId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.reportsService.queueMarksheet(
      schoolId,
      studentId,
      examId,
      userId,
    );
  }

  @Post('grade-sheet/:examId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.ACCEPTED)
  generateGradeSheet(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('examId', ParseUuidPipe) examId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.reportsService.queueGradeSheet(schoolId, examId, userId);
  }

  @Post('ledger/:studentId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.ACCEPTED)
  generateLedger(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.reportsService.queueLedger(schoolId, studentId, userId);
  }

  @Get('files')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  listReportFiles(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reportsService.listReportFiles(schoolId, pagination);
  }

  @Get('files/:fileId/download')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  getDownloadUrl(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('fileId', ParseUuidPipe) fileId: string,
  ) {
    return this.reportsService.getDownloadUrl(schoolId, fileId);
  }
}
