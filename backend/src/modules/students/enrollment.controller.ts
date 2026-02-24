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
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { EnrollmentService } from './enrollment.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'enrollments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
    @Query('gradeId') gradeId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.enrollmentService.findAll(
      req.user.schoolId,
      pagination,
      gradeId,
      academicYearId,
    );
  }

  @Post()
  @RequireRoles(Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentService.create(req.user.schoolId, dto, req.user.sub);
  }

  @Get('student/:studentId')
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findByStudent(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.enrollmentService.findByStudent(req.user.schoolId, studentId);
  }
}
