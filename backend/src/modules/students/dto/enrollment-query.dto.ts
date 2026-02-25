import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class EnrollmentQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;
}
