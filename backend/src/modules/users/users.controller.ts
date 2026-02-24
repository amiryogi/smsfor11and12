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
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() pagination: PaginationDto,
    @Query('role') role?: Role,
  ) {
    return this.usersService.findAll(req.user.schoolId, pagination, role);
  }

  @Get(':id')
  @RequireRoles(Role.ADMIN)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.usersService.findOne(req.user.schoolId, id);
  }

  @Post()
  @RequireRoles(Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(req.user.schoolId, dto, req.user.sub);
  }

  @Patch(':id')
  @RequireRoles(Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.schoolId, id, dto, req.user.sub);
  }

  @Delete(':id')
  @RequireRoles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.usersService.remove(req.user.schoolId, id, req.user.sub);
  }
}
