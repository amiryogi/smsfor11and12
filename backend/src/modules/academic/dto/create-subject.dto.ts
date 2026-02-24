import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

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
