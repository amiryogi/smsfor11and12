import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeeStructureService } from './fee-structure.service.js';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto.js';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'schools/:schoolId/fee-structures', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeStructureController {
  constructor(private readonly feeStructureService: FeeStructureService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.feeStructureService.create(schoolId, dto);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findAll(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Query() pagination: PaginationDto,
    @Query('academicYearId') academicYearId?: string,
    @Query('feeType') feeType?: string,
    @Query('level') level?: string,
    @Query('stream') stream?: string,
  ) {
    return this.feeStructureService.findAll(schoolId, pagination, {
      academicYearId,
      feeType,
      level: level ? Number(level) : undefined,
      stream,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findOne(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.feeStructureService.findOne(schoolId, id);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.feeStructureService.update(schoolId, id, dto);
  }

  @Delete(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.feeStructureService.remove(schoolId, id);
  }
}
