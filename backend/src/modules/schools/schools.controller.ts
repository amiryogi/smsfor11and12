import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { SchoolsService } from './schools.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'schools', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('current')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async getCurrent(@Request() req: { user: { schoolId: string } }) {
    return this.schoolsService.findCurrent(req.user.schoolId);
  }

  @Patch('current')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateCurrent(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.schoolsService.updateCurrent(req.user.schoolId, dto);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN)
  async findAll(@Query() pagination: PaginationDto) {
    return this.schoolsService.findAll(pagination);
  }

  @Post()
  @RequireRoles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto);
  }
}
