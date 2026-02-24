import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
