import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ExamsService } from './exams.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { Role, ExamStatus } from '@prisma/client';

@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: ExamStatus,
  ) {
    return this.examsService.findAll(
      req.user.schoolId,
      pagination,
      academicYearId,
      status,
    );
  }

  @Get(':id')
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.examsService.findOne(req.user.schoolId, id);
  }

  @Post()
  @RequireRoles(Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateExamDto,
  ) {
    return this.examsService.create(req.user.schoolId, dto, req.user.sub);
  }

  @Patch(':id')
  @RequireRoles(Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(req.user.schoolId, id, dto, req.user.sub);
  }

  @Post(':id/open-marks-entry')
  @RequireRoles(Role.ADMIN)
  async openMarksEntry(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.examsService.openMarksEntry(
      req.user.schoolId,
      id,
      req.user.sub,
    );
  }

  @Post(':id/finalize')
  @RequireRoles(Role.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  async finalize(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.examsService.finalize(req.user.schoolId, id, req.user.sub);
  }

  @Post(':id/publish')
  @RequireRoles(Role.ADMIN)
  async publish(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.examsService.publish(req.user.schoolId, id, req.user.sub);
  }
}
