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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // --- Student Reports ---

  @Get('students/summary')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  getStudentSummary(@Request() req: { user: { schoolId: string } }) {
    return this.reportsService.studentSummary(req.user.schoolId);
  }

  // --- Exam Reports ---

  @Get('exam/:examId/grade/:gradeId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  getGradeResults(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Param('gradeId', ParseUuidPipe) gradeId: string,
  ) {
    return this.reportsService.getGradeResults(
      req.user.schoolId,
      examId,
      gradeId,
    );
  }

  @Get('exam/:examId/student/:studentId/marksheet')
  @RequireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.ACCEPTED)
  generateMarksheet(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.reportsService.queueMarksheet(
      req.user.schoolId,
      studentId,
      examId,
      req.user.sub,
    );
  }

  @Post('exam/:examId/bulk-marksheets')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.ACCEPTED)
  bulkMarksheets(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
  ) {
    return this.reportsService.queueBulkMarksheets(
      req.user.schoolId,
      examId,
      req.user.sub,
    );
  }

  // --- Finance Reports ---

  @Get('finance/ledger')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  getFinancialLedger(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFinancialLedger(
      req.user.schoolId,
      pagination,
      startDate,
      endDate,
    );
  }

  @Get('finance/student/:studentId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.PARENT)
  getStudentFinancialStatement(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.reportsService.getStudentFinancialStatement(
      req.user.schoolId,
      studentId,
    );
  }

  @Get('finance/outstanding')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  getOutstandingBalances(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
  ) {
    return this.reportsService.getOutstandingBalances(
      req.user.schoolId,
      pagination,
    );
  }

  // --- NEB Certificates ---

  @Get('student/:studentId/character-certificate')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.ACCEPTED)
  generateCharacterCertificate(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.reportsService.queueCharacterCertificate(
      req.user.schoolId,
      studentId,
      req.user.sub,
    );
  }

  @Get('student/:studentId/transfer-certificate')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  generateTransferCertificate(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.reportsService.queueTransferCertificate(
      req.user.schoolId,
      studentId,
      req.user.sub,
    );
  }

  // --- Report Files ---

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
