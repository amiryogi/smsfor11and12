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
import { SubjectService } from './subject.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'academic/subjects', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @RequireRoles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
  ) {
    return this.subjectService.findAll(req.user.schoolId, pagination);
  }

  @Post()
  @RequireRoles(Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectService.create(req.user.schoolId, dto);
  }

  @Patch(':id')
  @RequireRoles(Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(req.user.schoolId, id, dto);
  }

  @Delete(':id')
  @RequireRoles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.subjectService.remove(req.user.schoolId, id);
  }
}
