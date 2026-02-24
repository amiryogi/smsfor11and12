import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTermDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
