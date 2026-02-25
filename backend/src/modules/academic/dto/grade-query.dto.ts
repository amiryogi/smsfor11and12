import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class GradeQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  level?: number;

  @IsOptional()
  @IsString()
  stream?: string;
}
