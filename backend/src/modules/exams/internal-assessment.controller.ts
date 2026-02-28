import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { InternalAssessmentService } from './internal-assessment.service.js';
import { CreateInternalAssessmentDto } from './dto/create-internal-assessment.dto.js';
import { InternalAssessmentQueryDto } from './dto/internal-assessment-query.dto.js';

@Controller({ path: 'internal-assessments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalAssessmentController {
  constructor(private readonly service: InternalAssessmentService) {}

  /**
   * POST /internal-assessments
   * Create or update a single internal assessment entry.
   */
  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async upsert(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateInternalAssessmentDto,
  ) {
    return this.service.upsert(req.user.schoolId, dto, req.user.sub);
  }

  /**
   * POST /internal-assessments/bulk/:examId
   * Bulk upsert internal assessments for an exam.
   */
  @Post('bulk/:examId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async bulkUpsert(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('examId', ParseUuidPipe) examId: string,
    @Body() entries: CreateInternalAssessmentDto[],
  ) {
    return this.service.bulkUpsert(req.user.schoolId, examId, entries, req.user.sub);
  }

  /**
   * GET /internal-assessments
   */
  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: InternalAssessmentQueryDto,
  ) {
    return this.service.findAll(req.user.schoolId, query);
  }

  /**
   * GET /internal-assessments/:id
   */
  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.service.findOne(req.user.schoolId, id);
  }

  /**
   * DELETE /internal-assessments/:id
   */
  @Delete(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.service.remove(req.user.schoolId, id, req.user.sub);
  }
}
