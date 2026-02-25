import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class ExamResultQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  gradeSubjectId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}
