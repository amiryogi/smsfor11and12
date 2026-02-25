import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class NotificationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  unreadOnly?: string;

  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  isRead?: string;
}
