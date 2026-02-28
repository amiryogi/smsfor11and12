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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { ExamWeightageService } from './exam-weightage.service.js';
import { CreateExamWeightageDto } from './dto/create-exam-weightage.dto.js';
import { UpdateExamWeightageDto } from './dto/update-exam-weightage.dto.js';
import { ExamWeightageQueryDto } from './dto/exam-weightage-query.dto.js';

@Controller({ path: 'exam-weightages', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamWeightageController {
  constructor(private readonly service: ExamWeightageService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateExamWeightageDto,
  ) {
    return this.service.create(req.user.schoolId, dto, req.user.sub);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: ExamWeightageQueryDto,
  ) {
    return this.service.findAll(req.user.schoolId, query);
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.service.findOne(req.user.schoolId, id);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateExamWeightageDto,
  ) {
    return this.service.update(req.user.schoolId, id, dto, req.user.sub);
  }

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
