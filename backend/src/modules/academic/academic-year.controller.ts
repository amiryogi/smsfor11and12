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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { AcademicYearService } from './academic-year.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';
import { CreateTermDto } from './dto/create-term.dto.js';
import { UpdateTermDto } from './dto/update-term.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'academic', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Get('years')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
  ) {
    return this.academicYearService.findAll(req.user.schoolId, pagination);
  }

  @Post('years')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreateAcademicYearDto,
  ) {
    return this.academicYearService.create(req.user.schoolId, dto);
  }

  @Patch('years/:id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearService.update(req.user.schoolId, id, dto);
  }

  @Post('years/:id/set-current')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async setCurrent(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.academicYearService.setCurrent(req.user.schoolId, id);
  }

  @Get('years/:yearId/terms')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findTerms(
    @Request() req: { user: { schoolId: string } },
    @Param('yearId', ParseUuidPipe) yearId: string,
  ) {
    return this.academicYearService.findTerms(req.user.schoolId, yearId);
  }

  @Post('years/:yearId/terms')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async createTerm(
    @Request() req: { user: { schoolId: string } },
    @Param('yearId', ParseUuidPipe) yearId: string,
    @Body() dto: CreateTermDto,
  ) {
    return this.academicYearService.createTerm(req.user.schoolId, yearId, dto);
  }

  @Patch('terms/:id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateTerm(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateTermDto,
  ) {
    return this.academicYearService.updateTerm(req.user.schoolId, id, dto);
  }
}
