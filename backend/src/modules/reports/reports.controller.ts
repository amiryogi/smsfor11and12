import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('students/summary')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  getStudentSummary(@Request() req: { user: { schoolId: string } }) {
    return this.reportsService.studentSummary(req.user.schoolId);
  }

  @Post('marksheet/:studentId/:examId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.ACCEPTED)
  generateMarksheet(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Param('examId', ParseUuidPipe) examId: string,
  ) {
    return this.reportsService.queueMarksheet(
      req.user.schoolId,
      studentId,
      examId,
      req.user.sub,
    );
  }

  @Post('grade-sheet/:examId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.ACCEPTED)
  generateGradeSheet(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
  ) {
    return this.reportsService.queueGradeSheet(
      req.user.schoolId,
      examId,
      req.user.sub,
    );
  }

  @Post('ledger/:studentId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.ACCEPTED)
  generateLedger(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.reportsService.queueLedger(
      req.user.schoolId,
      studentId,
      req.user.sub,
    );
  }

  @Get('files')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  listReportFiles(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
  ) {
    return this.reportsService.listReportFiles(req.user.schoolId, pagination);
  }

  @Get('files/:fileId/download')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  getDownloadUrl(
    @Request() req: { user: { schoolId: string } },
    @Param('fileId', ParseUuidPipe) fileId: string,
  ) {
    return this.reportsService.getDownloadUrl(req.user.schoolId, fileId);
  }
}
