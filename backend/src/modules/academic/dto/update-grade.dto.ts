import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
