import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { GradeService } from './grade.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import {
  AssignGradeSubjectDto,
  UpdateGradeSubjectDto,
} from './dto/assign-grade-subject.dto.js';
import { Role, Stream } from '@prisma/client';

@Controller({ path: 'academic', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Get('grades')
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
    @Query('level') level?: number,
    @Query('stream') stream?: Stream,
  ) {
    return this.gradeService.findAll(
      req.user.schoolId,
      pagination,
      level ? Number(level) : undefined,
      stream,
    );
  }

  @Post('grades')
  @RequireRoles(Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradeService.create(req.user.schoolId, dto);
  }

  @Patch('grades/:id')
  @RequireRoles(Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradeService.update(req.user.schoolId, id, dto);
  }

  @Delete('grades/:id')
  @RequireRoles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.gradeService.remove(req.user.schoolId, id);
  }

  @Get('grades/:gradeId/subjects')
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findGradeSubjects(
    @Request() req: { user: { schoolId: string } },
    @Param('gradeId', ParseUuidPipe) gradeId: string,
  ) {
    return this.gradeService.findGradeSubjects(req.user.schoolId, gradeId);
  }

  @Post('grades/:gradeId/subjects')
  @RequireRoles(Role.ADMIN)
  async assignSubject(
    @Request() req: { user: { schoolId: string } },
    @Param('gradeId', ParseUuidPipe) gradeId: string,
    @Body() dto: AssignGradeSubjectDto,
  ) {
    return this.gradeService.assignSubject(req.user.schoolId, gradeId, dto);
  }

  @Patch('grade-subjects/:id')
  @RequireRoles(Role.ADMIN)
  async updateGradeSubject(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateGradeSubjectDto,
  ) {
    return this.gradeService.updateGradeSubject(req.user.schoolId, id, dto);
  }

  @Delete('grade-subjects/:id')
  @RequireRoles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGradeSubject(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.gradeService.removeGradeSubject(req.user.schoolId, id);
  }
}
