import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  creditHours?: number;

  @IsOptional()
  @IsBoolean()
  hasTheory?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPractical?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  theoryFullMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  practicalFullMarks?: number;
}
