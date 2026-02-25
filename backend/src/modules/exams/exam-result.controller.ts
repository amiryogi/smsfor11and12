import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
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
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Body() dto: CreateExamResultDto,
  ) {
    return this.examResultService.createResult(req.user.schoolId, examId, dto);
  }

  @Post(':examId/results/bulk')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async bulkCreateResults(
    @Request() req: { user: { schoolId: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Body() body: { results: CreateExamResultDto[] },
  ) {
    return this.examResultService.bulkCreateResults(
      req.user.schoolId,
      examId,
      body.results,
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
}
