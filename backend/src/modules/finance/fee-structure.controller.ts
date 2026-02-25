import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
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
import { FeeStructureQueryDto } from './dto/fee-structure-query.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'finance/fee-structures', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeStructureController {
  constructor(private readonly feeStructureService: FeeStructureService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.feeStructureService.create(req.user.schoolId, dto);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: FeeStructureQueryDto,
  ) {
    return this.feeStructureService.findAll(req.user.schoolId, query, {
      academicYearId: query.academicYearId,
      feeType: query.feeType,
      level: query.level ? Number(query.level) : undefined,
      stream: query.stream,
    });
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.feeStructureService.findOne(req.user.schoolId, id);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.feeStructureService.update(req.user.schoolId, id, dto);
  }

  @Delete(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.feeStructureService.remove(req.user.schoolId, id);
  }
}
