import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { ExamResultQueryDto } from './dto/exam-result-query.dto.js';
import { ExamResultService } from './exam-result.service.js';
import { CreateExamResultDto } from './dto/create-exam-result.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamResultController {
  constructor(private readonly examResultService: ExamResultService) {}

  @Get(':examId/results')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findByExam(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Query() query: ExamResultQueryDto,
  ) {
    return this.examResultService.findByExam(
      req.user.schoolId,
      examId,
      query,
      query.gradeSubjectId,
      query.studentId,
    );
  }

  @Post(':examId/results')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async createResult(
    @Request() req: { user: { schoolId: string; sub: string; role: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Body() dto: CreateExamResultDto,
  ) {
    return this.examResultService.createResult(req.user.schoolId, examId, dto, {
      userId: req.user.sub,
      role: req.user.role,
    });
  }

  @Post(':examId/results/bulk')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async bulkCreateResults(
    @Request() req: { user: { schoolId: string; sub: string; role: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Body() body: { results: CreateExamResultDto[] },
  ) {
    return this.examResultService.bulkCreateResults(
      req.user.schoolId,
      examId,
      body.results,
      { userId: req.user.sub, role: req.user.role },
    );
  }

  @Get(':examId/results/student/:studentId')
  @RequireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  async findStudentResults(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.examResultService.findStudentResults(
      req.user.schoolId,
      examId,
      studentId,
    );
  }

  @Get(':examId/summaries')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findExamSummaries(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
  ) {
    return this.examResultService.findExamSummaries(
      req.user.schoolId,
      examId,
    );
  }

  @Get(':examId/summaries/student/:studentId')
  @RequireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  async findStudentSummary(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.examResultService.findStudentSummary(
      req.user.schoolId,
      examId,
      studentId,
    );
  }

  /**
   * POST /exams/:examId/results/import-csv
   * Upload a CSV with columns: studentId, gradeSubjectId, theoryMarksObtained, practicalMarksObtained
   * Parses and upserts all rows in a single transaction (same as bulk entry).
   */
  @Post(':examId/results/import-csv')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Request() req: { user: { schoolId: string; sub: string; role: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('CSV file is required');

    const csvText = file.buffer.toString('utf-8');
    const results = this.parseCsv(csvText);

    if (results.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    const created = await this.examResultService.bulkCreateResults(
      req.user.schoolId,
      examId,
      results,
      { userId: req.user.sub, role: req.user.role },
    );

    return { imported: created.length, results: created };
  }

  // ── CSV parser ──────────────────────────────────────────
  private parseCsv(csvText: string): CreateExamResultDto[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return []; // header + at least 1 data row

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const studentIdIdx = header.indexOf('studentid');
    const gradeSubjectIdIdx = header.indexOf('gradesubjectid');
    const theoryIdx = header.indexOf('theorymarksobtained');
    const practicalIdx = header.indexOf('practicalmarksobtained');

    if (studentIdIdx < 0 || gradeSubjectIdIdx < 0) {
      throw new BadRequestException(
        'CSV must have columns: studentId, gradeSubjectId. Optional: theoryMarksObtained, practicalMarksObtained',
      );
    }

    const results: CreateExamResultDto[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const dto = new CreateExamResultDto();
      dto.studentId = cols[studentIdIdx];
      dto.gradeSubjectId = cols[gradeSubjectIdIdx];
      if (theoryIdx >= 0 && cols[theoryIdx] !== '') {
        dto.theoryMarksObtained = Number(cols[theoryIdx]);
      }
      if (practicalIdx >= 0 && cols[practicalIdx] !== '') {
        dto.practicalMarksObtained = Number(cols[practicalIdx]);
      }
      results.push(dto);
    }
    return results;
  }
}
