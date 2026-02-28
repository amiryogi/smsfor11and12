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
import { SubjectSelectionService } from './subject-selection.service.js';
import { CreateSubjectSelectionDto } from './dto/create-subject-selection.dto.js';
import { SubjectSelectionQueryDto } from './dto/subject-selection-query.dto.js';

@Controller({ path: 'subject-selections', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectSelectionController {
  constructor(private readonly service: SubjectSelectionService) {}

  /**
   * POST /subject-selections
   * Assign optional/elective subjects to a student for an academic year.
   */
  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateSubjectSelectionDto,
  ) {
    return this.service.create(req.user.schoolId, dto, req.user.sub);
  }

  /**
   * GET /subject-selections
   */
  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: SubjectSelectionQueryDto,
  ) {
    return this.service.findAll(req.user.schoolId, query);
  }

  /**
   * GET /subject-selections/student/:studentId
   * Get all subject selections for a student in an academic year.
   */
  @Get('student/:studentId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT)
  async findByStudent(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.findByStudent(req.user.schoolId, studentId, academicYearId);
  }

  /**
   * DELETE /subject-selections/:id
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
