import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  role?: string;
}
